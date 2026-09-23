import React, { useState, useRef, useEffect } from 'react'
import { message } from 'antd'
import { useAuth } from '@/context/AuthContext'
import { userService } from '@/services/userService'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function Settings() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Form states initialized from active authenticated user
  const [firstName, setFirstName] = useState(user?.profile?.firstName || '')
  const [lastName, setLastName] = useState(user?.profile?.lastName || '')
  const [username, setUsername] = useState(user?.username || '')
  const [phone, setPhone] = useState(user?.profile?.phone || '')
  const [dateOfBirth, setDateOfBirth] = useState(user?.profile?.dateOfBirth || '')
  const [gender, setGender] = useState(user?.profile?.gender || '')
  const [profileImage, setProfileImage] = useState(user?.profile?.profileImage || '')

  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Keep state in sync if auth user updates
  useEffect(() => {
    if (user) {
      setFirstName(user.profile?.firstName || '')
      setLastName(user.profile?.lastName || '')
      setUsername(user.username || '')
      setPhone(user.profile?.phone || '')
      setDateOfBirth(user.profile?.dateOfBirth || '')
      setGender(user.profile?.gender || '')
      setProfileImage(user.profile?.profileImage || '')
    }
  }, [user])

  const initials = `${firstName?.[0] || user?.profile?.firstName?.[0] || ''}${
    lastName?.[0] || user?.profile?.lastName?.[0] || ''
  }`.toUpperCase() || 'U'

  const fullName = `${firstName} ${lastName}`.trim() || username || 'User Profile'
  const primaryRole = user?.roles?.[0]?.replace('_', ' ') || 'User'
  const affiliation =
    (user as any)?.affiliation || (user?.roles?.includes('EXTERNAL_USER') ? 'External' : 'Internal')

  // Handle image file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      message.error('Profile image must be smaller than 5MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      message.error('Please upload a valid image file (PNG, JPG, WebP).')
      return
    }

    try {
      setIsUploadingImage(true)
      const newImageUrl = await userService.uploadAvatar(file)
      setProfileImage(newImageUrl)
      message.success('Profile image updated successfully!')
    } catch {
      message.error('Failed to process image. Please try another file.')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle image removal
  const handleRemoveImage = async () => {
    try {
      setIsUploadingImage(true)
      await userService.removeAvatar()
      setProfileImage('')
      message.success('Profile photo removed.')
    } catch {
      message.error('Failed to remove photo.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Save profile information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim()) {
      message.error('First Name is required.')
      return
    }

    try {
      setIsSaving(true)
      await userService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        dateOfBirth,
        gender,
        profileImage,
      })
      message.success('Profile changes saved successfully!')
    } catch {
      message.error('Failed to save profile changes.')
    } finally {
      setIsSaving(false)
    }
  }

  // Reset form to current user values
  const handleResetForm = () => {
    if (user) {
      setFirstName(user.profile?.firstName || '')
      setLastName(user.profile?.lastName || '')
      setUsername(user.username || '')
      setPhone(user.profile?.phone || '')
      setDateOfBirth(user.profile?.dateOfBirth || '')
      setGender(user.profile?.gender || '')
      setProfileImage(user.profile?.profileImage || '')
      message.info('Form reset to saved values.')
    }
  }

  const hasUnsavedChanges =
    firstName !== (user?.profile?.firstName || '') ||
    lastName !== (user?.profile?.lastName || '') ||
    username !== (user?.username || '') ||
    phone !== (user?.profile?.phone || '') ||
    dateOfBirth !== (user?.profile?.dateOfBirth || '') ||
    gender !== (user?.profile?.gender || '')

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account & Profile Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your personal profile, display photo, and account details.
        </p>
      </div>

      {/* Main Section: Avatar Card on left, Details Form on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Identity Card */}
        <div className="bg-card border-border rounded-xl border p-6 shadow-xs space-y-5 flex flex-col items-center text-center">
          <Avatar className="h-28 w-28 rounded-full ring-2 ring-border shadow-xs">
            <AvatarImage src={profileImage || ''} alt={fullName} className="object-cover" />
            <AvatarFallback className="rounded-full bg-brand-blue/10 text-brand-blue text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="w-full">
            <h2 className="text-base font-semibold text-foreground">{fullName}</h2>
            <p className="text-xs text-muted-foreground mt-1 break-all select-all px-2" title={user?.email}>
              {user?.email}
            </p>
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-blue/10 text-brand-blue uppercase tracking-wider">
                {primaryRole}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground uppercase tracking-wider border border-border">
                {affiliation}
              </span>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />

          {/* Avatar Action Buttons */}
          <div className="w-full space-y-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="w-full text-xs cursor-pointer"
            >
              {isUploadingImage ? 'Uploading...' : 'Upload New Photo'}
            </Button>

            {profileImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
                className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                Remove Photo
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Accepted formats: JPG, PNG, WebP (max 5MB).
          </p>
        </div>

        {/* Right Column: Profile Edit Form */}
        <div className="lg:col-span-2 bg-card border-border rounded-xl border p-6 shadow-xs">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your contact details and basic information.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium text-foreground">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="First name"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-foreground">
                  Last Name
                </Label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-foreground">
                  Username
                </Label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Email Address
                  </Label>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Verified
                  </span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  title={user?.email || ''}
                  className="h-9 w-full rounded-md border border-input bg-muted/50 px-3 text-xs text-muted-foreground outline-none cursor-not-allowed select-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                  Phone Number
                </Label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth" className="text-xs font-medium text-foreground">
                  Date of Birth
                </Label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-medium text-foreground">
                  Gender
                </Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Form Action Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetForm}
                disabled={!hasUnsavedChanges || isSaving}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="text-xs bg-brand-blue !text-white hover:bg-brand-blue/90 shadow-xs cursor-pointer font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Full-width Role & Access Information Card on the same page */}
      <div className="bg-card border-border rounded-xl border p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Role & Access Information</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            System access credentials, assigned roles, and organizational hierarchy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
            <div className="text-xs font-semibold text-foreground">
              Assigned System Roles
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(user?.roles || []).map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-blue/10 text-brand-blue border border-brand-blue/20"
                >
                  {r}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Roles determine permissions across dashboard modules.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
            <div className="text-xs font-semibold text-foreground">
              Supervision & Affiliation
            </div>
            <div className="text-xs text-foreground">
              Affiliation:{' '}
              <span className="font-semibold capitalize text-foreground">{affiliation}</span>
            </div>
            {user?.managerName && (
              <div className="text-xs text-foreground">
                Supervised by:{' '}
                <span className="font-semibold text-foreground">{user.managerName}</span>
              </div>
            )}
            <div className="text-[11px] text-muted-foreground pt-1">
              User ID: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] select-all">{user?.publicId || user?.id}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
