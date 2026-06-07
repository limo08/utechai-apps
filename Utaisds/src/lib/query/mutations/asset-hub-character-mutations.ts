import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  clearTaskTargetOverlay,
  upsertTaskTargetOverlay,
} from '../task-target-overlay'
import {
  requestJsonWithError,
  requestVoidWithError,
} from './mutation-shared'
import {
  GLOBAL_ASSET_PROJECT_ID,
  invalidateGlobalCharacters,
} from './asset-hub-mutations-shared'

export function useGenerateCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({
      characterId,
      appearanceIndex,
      artStyle,
      count,
    }: {
      characterId: string
      appearanceIndex: number
      artStyle?: string
      count?: number
    }) => {
      return await requestJsonWithError(`/api/assets/${characterId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'global',
          kind: 'character',
          appearanceIndex,
          artStyle,
          count,
        }),
      }, 'Failed to generate image')
    },
    onMutate: ({ characterId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalCharacter',
        targetId: characterId,
        intent: 'generate',
      })
    },
    onError: (_error, { characterId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalCharacter',
        targetId: characterId,
      })
    },
    onSettled: invalidateCharacters,
  })
}

export function useModifyCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({
      characterId,
      appearanceIndex,
      imageIndex,
      modifyPrompt,
      extraImageUrls,
    }: {
      characterId: string
      appearanceIndex: number
      imageIndex: number
      modifyPrompt: string
      extraImageUrls?: string[]
    }) => {
      return await requestJsonWithError(`/api/assets/${characterId}/modify-render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'global',
          kind: 'character',
          appearanceIndex,
          imageIndex,
          modifyPrompt,
          extraImageUrls,
        }),
      }, 'Failed to modify image')
    },
    onMutate: ({ characterId, appearanceIndex, imageIndex }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalCharacterAppearance',
        targetId: `${characterId}:${appearanceIndex}:${imageIndex}`,
        intent: 'modify',
      })
    },
    onError: (_error, { characterId, appearanceIndex, imageIndex }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalCharacterAppearance',
        targetId: `${characterId}:${appearanceIndex}:${imageIndex}`,
      })
    },
    onSettled: invalidateCharacters,
  })
}

export function useSelectCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({
      characterId,
      appearanceIndex,
      imageIndex,
      confirm = false,
    }: {
      characterId: string
      appearanceIndex: number
      imageIndex: number | null
      confirm?: boolean
    }) => {
      return await requestJsonWithError(`/api/assets/${characterId}/select-render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'global',
          kind: 'character',
          appearanceIndex,
          imageIndex,
          confirm,
        }),
      }, 'Failed to select image')
    },
    onSettled: () => {
      // Always invalidate the correct unified asset queries so the UI
      // reflects the updated selection state from the server.
      void invalidateCharacters()
    },
  })
}

export function useUndoCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({ characterId, appearanceIndex }: { characterId: string; appearanceIndex: number }) => {
      return await requestJsonWithError(`/api/assets/${characterId}/revert-render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'global',
          kind: 'character',
          appearanceIndex,
        }),
      }, 'Failed to undo image')
    },
    onSuccess: invalidateCharacters,
  })
}

export function useUploadCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({
      file,
      characterId,
      appearanceIndex,
      labelText,
      imageIndex,
    }: {
      file: File
      characterId: string
      appearanceIndex: number
      labelText: string
      imageIndex?: number
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'character')
      formData.append('id', characterId)
      formData.append('appearanceIndex', appearanceIndex.toString())
      formData.append('labelText', labelText)
      if (imageIndex !== undefined) {
        formData.append('imageIndex', imageIndex.toString())
      }

      return await requestJsonWithError('/api/asset-hub/upload-image', {
        method: 'POST',
        body: formData,
      }, 'Failed to upload image')
    },
    onSuccess: invalidateCharacters,
  })
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async (characterId: string) => {
      await requestVoidWithError(
        `/api/asset-hub/characters/${characterId}`,
        { method: 'DELETE' },
        'Failed to delete character',
      )
    },
    onSettled: invalidateCharacters,
  })
}

export function useDeleteCharacterAppearance() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({ characterId, appearanceIndex }: { characterId: string; appearanceIndex: number }) => {
      await requestVoidWithError(
        `/api/asset-hub/appearances?characterId=${characterId}&appearanceIndex=${appearanceIndex}`,
        { method: 'DELETE' },
        'Failed to delete appearance',
      )
    },
    onSuccess: invalidateCharacters,
  })
}

export function useUploadCharacterVoice() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({ file, characterId }: { file: File; characterId: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('characterId', characterId)

      return await requestJsonWithError('/api/asset-hub/character-voice', {
        method: 'POST',
        body: formData,
      }, 'Failed to upload voice')
    },
    onSuccess: invalidateCharacters,
  })
}
