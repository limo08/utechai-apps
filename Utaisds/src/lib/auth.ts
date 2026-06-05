import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { logAuthAction } from './logging/semantic'
import { prisma } from './prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
  // 🔥 允许从任意 Host 访问（解决局域网访问问题）
  trustHost: true,
  // 🔥 根据 URL 协议决定是否使用 Secure Cookie
  // 局域网 HTTP 访问时需要关闭，否则 Cookie 无法设置
  useSecureCookies: (process.env.NEXTAUTH_URL || '').startsWith('https://'),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          logAuthAction('LOGIN', credentials?.username || 'unknown', { error: 'Missing credentials' })
          return null
        }

        // Use dev URL if available, otherwise production URL
        const modelGatewayUrl = process.env.MODEL_GATEWAY_URL
        if (!modelGatewayUrl) {
          logAuthAction('LOGIN', credentials.username, { error: 'MODEL_GATEWAY_URL not configured' })
          return null
        }

        // Call Model Gateway login API
        let gatewayResponse
        let httpStatus: number
        const loginUrl = `${modelGatewayUrl}/api/user/login`

        try {
          logAuthAction('LOGIN', credentials.username, { action: 'calling_gateway', url: loginUrl })

          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password
            })
          })

          httpStatus = response.status
          const responseText = await response.text()

          try {
            gatewayResponse = JSON.parse(responseText)
          } catch (parseError) {
            logAuthAction('LOGIN', credentials.username, {
              error: 'Invalid JSON response',
              httpStatus,
              responseText: responseText.substring(0, 500)
            })
            return null
          }

          logAuthAction('LOGIN', credentials.username, {
            action: 'gateway_response_received',
            httpStatus,
            response: gatewayResponse
          })
        } catch (error) {
          logAuthAction('LOGIN', credentials.username, {
            error: 'Gateway API call failed',
            url: loginUrl,
            details: String(error)
          })
          return null
        }

        // Check HTTP status
        if (httpStatus !== 200 && httpStatus !== 201) {
          logAuthAction('LOGIN', credentials.username, {
            error: 'Gateway returned non-200 status',
            httpStatus,
            response: gatewayResponse
          })
          return null
        }

        // Extract gateway user ID from response and convert to string
        // Gateway returns id as number (e.g., 1), but we store it as string
        const rawGatewayUserId = gatewayResponse?.data?.id || gatewayResponse?.id
        const gatewayUserId = rawGatewayUserId != null ? String(rawGatewayUserId) : null

        if (!gatewayUserId) {
          logAuthAction('LOGIN', credentials.username, {
            error: 'No gateway user ID in response',
            httpStatus,
            response: gatewayResponse
          })
          return null
        }

        // Look up local user by name AND gatewayUserId
        let user
        try {
          // Hash the password for local storage
          const hashedPassword = await bcrypt.hash(credentials.password, 12)

          user = await prisma.user.findFirst({
            where: {
              name: credentials.username,
              gatewayUserId: gatewayUserId
            }
          })

          // If user doesn't exist, check if username exists or create new user
          if (!user) {
            const existingUserByName = await prisma.user.findUnique({
              where: { name: credentials.username }
            })

            if (existingUserByName) {
              // User exists by name but with different or null gatewayUserId
              if (existingUserByName.gatewayUserId && existingUserByName.gatewayUserId !== gatewayUserId) {
                // Account conflict - different gateway account
                logAuthAction('LOGIN', credentials.username, { error: 'Account conflict - different gateway user ID', existing: existingUserByName.gatewayUserId, incoming: gatewayUserId })
                return null
              }

              // Update gatewayUserId and last login time
              user = await prisma.user.update({
                where: { id: existingUserByName.id },
                data: {
                  ...(existingUserByName.gatewayUserId ? {} : { gatewayUserId }),
                  updatedAt: new Date()
                }
              })
              logAuthAction('LOGIN', credentials.username, { userId: user.id, gatewayUserId, action: 'updated_user' })
            } else {
              // User doesn't exist, create new user with password
              user = await prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                  data: {
                    name: credentials.username,
                    gatewayUserId,
                    password: hashedPassword
                  }
                })

                await tx.userBalance.create({
                  data: {
                    userId: newUser.id,
                    balance: 0,
                    frozenAmount: 0,
                    totalSpent: 0
                  }
                })

                return newUser
              })

              logAuthAction('REGISTER', credentials.username, { userId: user.id, gatewayUserId, success: true })
            }
          } else {
            // User exists, update last login time
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                updatedAt: new Date()
              }
            })
          }
        } catch (dbError) {
          logAuthAction('LOGIN', credentials.username, { error: 'Database operation failed', details: String(dbError) })
          return null
        }

        logAuthAction('LOGIN', user.name, { userId: user.id, gatewayUserId, success: true })

        return {
          id: user.id,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
