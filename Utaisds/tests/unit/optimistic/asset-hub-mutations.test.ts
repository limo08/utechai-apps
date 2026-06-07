import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GlobalCharacter, GlobalLocation } from '@/lib/query/hooks/useGlobalAssets'
import { MockQueryClient } from '../../helpers/mock-query-client'

let queryClient = new MockQueryClient()
const useQueryClientMock = vi.fn(() => queryClient)
const useMutationMock = vi.fn((options: unknown) => options)

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useRef: <T,>(value: T) => ({ current: value }),
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => useQueryClientMock(),
  useMutation: (options: unknown) => useMutationMock(options),
}))

vi.mock('@/lib/query/mutations/mutation-shared', async () => {
  const actual = await vi.importActual<typeof import('@/lib/query/mutations/mutation-shared')>(
    '@/lib/query/mutations/mutation-shared',
  )
  return {
    ...actual,
    requestJsonWithError: vi.fn(),
    requestVoidWithError: vi.fn(),
  }
})

const invalidateGlobalCharactersMock = vi.fn()
const invalidateGlobalLocationsMock = vi.fn()

vi.mock('@/lib/query/mutations/asset-hub-mutations-shared', async () => {
  const actual = await vi.importActual<typeof import('@/lib/query/mutations/asset-hub-mutations-shared')>(
    '@/lib/query/mutations/asset-hub-mutations-shared',
  )
  return {
    ...actual,
    invalidateGlobalCharacters: (...args: unknown[]) => invalidateGlobalCharactersMock(...args),
    invalidateGlobalLocations: (...args: unknown[]) => invalidateGlobalLocationsMock(...args),
  }
})

import {
  useSelectCharacterImage,
} from '@/lib/query/mutations/asset-hub-character-mutations'
import { useDeleteLocation as useDeleteAssetHubLocation } from '@/lib/query/mutations/asset-hub-location-mutations'

interface SelectCharacterMutation {
  onSettled: () => void
}

interface DeleteLocationMutation {
  onSettled: () => void
}

function buildGlobalCharacter(selectedIndex: number | null): GlobalCharacter {
  return {
    id: 'character-1',
    name: 'Hero',
    folderId: 'folder-1',
    customVoiceUrl: null,
    appearances: [{
      id: 'appearance-1',
      appearanceIndex: 0,
      changeReason: 'default',
      artStyle: 'realistic',
      description: null,
      descriptionSource: null,
      imageUrl: selectedIndex === null ? null : `img-${selectedIndex}`,
      imageUrls: ['img-0', 'img-1', 'img-2'],
      renderIndices: [0, 1, 2],
      selectedIndex,
      previousImageUrl: null,
      previousImageUrls: [],
      imageTaskRunning: false,
    }],
  }
}

function buildGlobalLocation(id: string): GlobalLocation {
  return {
    id,
    name: `Location ${id}`,
    summary: null,
    folderId: 'folder-1',
    artStyle: 'realistic',
    images: [{
      id: `${id}-img-0`,
      imageIndex: 0,
      description: null,
      imageUrl: null,
      previousImageUrl: null,
      isSelected: true,
      imageTaskRunning: false,
    }],
  }
}

describe('asset hub mutations', () => {
  beforeEach(() => {
    queryClient = new MockQueryClient()
    useQueryClientMock.mockClear()
    useMutationMock.mockClear()
    invalidateGlobalCharactersMock.mockClear()
    invalidateGlobalLocationsMock.mockClear()
  })

  it('selectCharacterImage invalidates global characters on settled', () => {
    const mutation = useSelectCharacterImage() as unknown as SelectCharacterMutation
    mutation.onSettled()
    expect(invalidateGlobalCharactersMock).toHaveBeenCalledTimes(1)
  })

  it('deleteLocation invalidates global locations on settled', () => {
    // Seed queries to ensure the mutation can be constructed
    const allLocationsKey = ['global-assets', 'locations']
    queryClient.seedQuery(allLocationsKey, [buildGlobalLocation('loc-1'), buildGlobalLocation('loc-2')])

    const mutation = useDeleteAssetHubLocation() as unknown as DeleteLocationMutation
    mutation.onSettled()
    expect(invalidateGlobalLocationsMock).toHaveBeenCalledTimes(1)
  })
})
