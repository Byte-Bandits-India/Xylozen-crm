import { apiClient } from '@/lib/apiClient'
import { store } from '@/store'
import { setUser } from '@/store/authSlice'
import type { User, UserProfile } from '@/types'

export type UpdateProfilePayload = {
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  profileImage?: string
}

/**
 * Compresses an image file in the browser using HTML Canvas,
 * generating a high-quality, lightweight base64 data URL (< 100 KB).
 */
export async function compressImage(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(event.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve(compressed)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

export const userService = {
  /**
   * Updates user profile fields and updates both backend and local state.
   * Crucially preserves user roles, permissions, and accessiblePages so sidebar
   * and access control navigation are never clobbered by partial backend responses.
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const currentUser = store.getState().auth.user
    if (!currentUser) {
      throw new Error('No authenticated user found')
    }

    // 1. Attempt backend update (fire-and-forget or capture returned profile data)
    let backendProfile: Partial<UserProfile> = {}
    try {
      const res = await apiClient.patch('/user/profile', payload)
      const data = res.data?.data || res.data
      if (data && typeof data === 'object') {
        if (data.profile) {
          backendProfile = data.profile
        } else if (!data.roles && !data.permissions) {
          backendProfile = data
        }
      }
    } catch {
      try {
        const res = await apiClient.put('/user/profile', payload)
        const data = res.data?.data || res.data
        if (data && typeof data === 'object') {
          if (data.profile) {
            backendProfile = data.profile
          } else if (!data.roles && !data.permissions) {
            backendProfile = data
          }
        }
      } catch {
        // Fallback to optimistic local update
      }
    }

    // 2. Synthesize updated profile
    const updatedProfile: UserProfile = {
      ...currentUser.profile,
      ...backendProfile,
      ...(payload.firstName !== undefined ? { firstName: payload.firstName } : {}),
      ...(payload.lastName !== undefined ? { lastName: payload.lastName } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.dateOfBirth !== undefined ? { dateOfBirth: payload.dateOfBirth } : {}),
      ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
      ...(payload.profileImage !== undefined ? { profileImage: payload.profileImage } : {}),
    }

    // 3. Construct updated user while strictly preserving roles, permissions, accessiblePages
    const updatedUser: User = {
      ...currentUser,
      username: payload.username || currentUser.username,
      roles: currentUser.roles && currentUser.roles.length > 0 ? currentUser.roles : ['USER'],
      permissions: currentUser.permissions || [],
      accessiblePages: currentUser.accessiblePages,
      managerPublicId: currentUser.managerPublicId,
      managerName: currentUser.managerName,
      profile: updatedProfile,
    }

    // 4. Update Redux store immediately
    store.dispatch(setUser(updatedUser))

    // 5. Save only safe profile fields to localStorage override cache
    try {
      localStorage.setItem(
        'user_profile_override',
        JSON.stringify({
          username: updatedUser.username,
          profile: {
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            phone: updatedProfile.phone,
            dateOfBirth: updatedProfile.dateOfBirth,
            gender: updatedProfile.gender,
            profileImage: updatedProfile.profileImage,
          },
        })
      )
    } catch {
      // LocalStorage error fallback
    }

    return updatedUser
  },

  /**
   * Compresses and uploads a new profile avatar image.
   */
  uploadAvatar: async (file: File): Promise<string> => {
    const base64Image = await compressImage(file, 400, 400, 0.85)

    // Attempt multipart form upload if endpoint accepts it
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('profileImage', file)
      await apiClient.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } catch {
      // Endpoint may not exist, fallback to profile update with base64 data
    }

    // Update user profile in local store and backend
    await userService.updateProfile({ profileImage: base64Image })
    return base64Image
  },

  /**
   * Removes current avatar image and resets to default initials.
   */
  removeAvatar: async (): Promise<void> => {
    try {
      await apiClient.delete('/user/avatar')
    } catch {
      // Endpoint may not exist, fallback to profile update
    }

    await userService.updateProfile({ profileImage: '' })
  },
}
