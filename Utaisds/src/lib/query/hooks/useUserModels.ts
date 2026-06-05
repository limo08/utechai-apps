'use client'

import { useQuery } from '@tanstack/react-query'
import type { ModelCapabilities } from '@/lib/model-config-contract'
import type { VideoPricingTier } from '@/lib/model-pricing/video-tier'
import { queryKeys } from '../keys'
import { apiFetch } from '@/lib/api-fetch'

export interface UserModelOption {
    value: string
    label: string
    provider?: string
    providerName?: string
    capabilities?: ModelCapabilities
    videoPricingTiers?: VideoPricingTier[]
}

export interface UserModelsPayload {
    text: UserModelOption[]
    image: UserModelOption[]
    video: UserModelOption[]
    tts: UserModelOption[]
    lipsync: UserModelOption[]
    voice_design: UserModelOption[]
}

export function useUserModels() {
    return useQuery({
        queryKey: queryKeys.userModels.all(),
        queryFn: async () => {
            const response = await apiFetch('/api/user/models')
            if (!response.ok) {
                throw new Error('Failed to fetch user models')
            }
            const data = await response.json()
            return {
                text: Array.isArray(data?.text) ? data.text : [],
                image: Array.isArray(data?.image) ? data.image : [],
                video: Array.isArray(data?.video) ? data.video : [],
                tts: Array.isArray(data?.tts) ? data.tts : [],
                lipsync: Array.isArray(data?.lipsync) ? data.lipsync : [],
                voice_design: Array.isArray(data?.voice_design) ? data.voice_design : [],
            } as UserModelsPayload
        },
    })
}
