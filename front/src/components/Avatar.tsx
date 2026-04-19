import { PencilIcon, UserIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useMemo, useState } from 'react'
import { differenceInHours } from 'date-fns'

import { IUser } from '@/MODELS/user.model'

import { api } from '@/services/api.service'
import { useAuth } from '@/services/authentication.service'
import S3Service from '@/services/s3.service'
import { cn } from '@/utils/cn'
import {
    convertBlobToBase64,
    isBase64Image,
    isBase64WithinSizeLimit,
    processImageForBase64,
    processImageForUpload,
} from '@/utils/image-utils'
import { isLikelyObjectId } from '@/utils/isLikelyObjectId'

import Loading from './Loading'

// Endpoint for user profile updates
const ENDPOINT = 'app/user'

export interface ImageUploadCallbacks {
    onSuccess?: () => Promise<void>
}

export interface ImageStrategy {
    getImageUrl: (user: IUser) => Promise<string | null>
    uploadImage: (file: File, user: IUser, callbacks: ImageUploadCallbacks) => Promise<void>
}

const SIZE_MAP = {
    sm: 32,
    md: 64,
    lg: 128,
}

// Scale factor for display size. Higher values means sharper images
const SIZE_SCALE_MAP = {
    sm: 1.2,
    md: 1.6,
    lg: 2,
}

// Core props that all avatar strategies share
interface AvatarBaseProps {
    user?: IUser
    size?: number | 'sm' | 'md' | 'lg'
    editable?: boolean
    downscaleQuality?: number | null
    onImageUpdate?: () => Promise<void>
    className?: string
}

// Base component that handles common functionality
function AvatarBase({
    user,
    size = 'md',
    editable = false,
    downscaleQuality = null,
    onImageUpdate,
    className = '',
    strategy,
}: AvatarBaseProps & { strategy: ImageStrategy }) {
    const { user: sessionUser, fetchUser } = useAuth()

    useEffect(() => {
        fetchUser()
    }, [])

    const [isUploading, setIsUploading] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [optimizedImage, setOptimizedImage] = useState<string | null>(null)

    const targetUser = useMemo(() => user ?? sessionUser, [user, sessionUser])

    // Convert size to actual dimensions
    const width = typeof size === 'number' ? size : SIZE_MAP[size]
    const height = width // Keep it square

    // Load image based on strategy
    useEffect(() => {
        const loadImage = async () => {
            if (!targetUser) return

            const url = await strategy.getImageUrl(targetUser)
            setImageUrl(url)
        }

        loadImage()
    }, [targetUser, strategy])

    // Effect to downscale the image when it changes or when width/height/quality changes
    useEffect(() => {
        if (imageUrl) {
            downscaleImageForDisplay(imageUrl)
        }
    }, [imageUrl, width, height, downscaleQuality])

    // Downscale for display
    const downscaleImageForDisplay = (imageUrl: string) => {
        const img = new Image()
        img.onload = () => {
            // Calculate a reasonable size to downscale to
            const sizeKey = typeof size === 'string' ? size : 'md'
            const MAX_SIZE = Math.max(width, height) * SIZE_SCALE_MAP[sizeKey]

            // Maintain aspect ratio while ensuring max dimension doesn't exceed MAX_SIZE
            let newWidth = img.width
            let newHeight = img.height

            if (newWidth > newHeight) {
                if (newWidth > MAX_SIZE) {
                    newHeight = (newHeight * MAX_SIZE) / newWidth
                    newWidth = MAX_SIZE
                }
            } else {
                if (newHeight > MAX_SIZE) {
                    newWidth = (newWidth * MAX_SIZE) / newHeight
                    newHeight = MAX_SIZE
                }
            }

            // Only downscale if the image is significantly larger than needed
            if (img.width > newWidth * 1.2 || img.height > newHeight * 1.2) {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) return

                canvas.width = newWidth
                canvas.height = newHeight
                ctx.drawImage(img, 0, 0, newWidth, newHeight)

                // Get the downscaled image as base64
                const downscaledImage =
                    downscaleQuality === null
                        ? canvas.toDataURL('image/png') // Lossless format
                        : canvas.toDataURL('image/jpeg', downscaleQuality)

                setOptimizedImage(downscaledImage)
            } else {
                // Image is already reasonably sized, no need to downscale
                setOptimizedImage(imageUrl)
            }
        }
        img.src = imageUrl
    }

    // Handle image upload
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !targetUser) {
            console.error('[Avatar.handleImageUpload] No file or target user', {
                file,
                targetUser,
            })
            return
        }

        try {
            setIsUploading(true)

            // Use the strategy's upload method
            await strategy.uploadImage(file, targetUser, {
                onSuccess: async () => {
                    if (targetUser._id === sessionUser?._id) {
                        await fetchUser()
                    }

                    // Handle update callback if provided
                    if (onImageUpdate) {
                        await onImageUpdate()
                    }

                    // Refresh the image
                    const url = await strategy.getImageUrl(targetUser)
                    if (url) {
                        setImageUrl(url)
                    }
                },
            })

            setIsUploading(false)
        } catch (error) {
            console.error('Error uploading image:', error)
            setIsUploading(false)
        }
    }

    return (
        <div
            className={cn(
                'flex relative justify-center items-center overflow-clip rounded-full group shrink-0',
                className
            )}
            style={{
                width: width,
                height: height,
            }}
        >
            {optimizedImage || imageUrl ? (
                <img
                    src={optimizedImage || imageUrl}
                    alt={`${targetUser?.firstName}'s profile`}
                    className='object-cover w-full h-full'
                    loading='lazy'
                />
            ) : (
                <p
                    className='my-auto font-bold text-brand'
                    style={{
                        fontSize: height * 0.45,
                        lineHeight: 1,
                    }}
                >
                    {targetUser?.firstName[0] || ''}
                    {targetUser?.lastName[0] || ''}
                </p>
            )}

            {editable && (
                <div className='absolute inset-0 flex items-center justify-center'>
                    {isUploading ? (
                        <Loading size={width * 0.4} />
                    ) : (
                        <label className='flex items-center justify-center w-full h-full transition-opacity duration-200 opacity-0 cursor-pointer bg-black/50 group-hover:opacity-100'>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handleImageUpload}
                                className='hidden'
                                disabled={isUploading}
                            />
                            <PencilIcon className='flex-shrink-0 w-[40%] mx-auto text-white' />
                        </label>
                    )}
                </div>
            )}
        </div>
    )
}

/*--- Strategy Implementations ---*/

const base64Strategy: ImageStrategy = {
    getImageUrl: async (user: IUser) => {
        return user?.profileImage || null
    },

    uploadImage: async (file: File, user: IUser, callbacks: ImageUploadCallbacks) => {
        const blob = await processImageForBase64(file)
        const profileImageBase64 = await convertBlobToBase64(blob)
        if (import.meta.env.DEV && !isBase64WithinSizeLimit(profileImageBase64)) {
            console.warn('[Avatar.base64Strategy] Base64 image may be too large for API requests', {
                fileName: file.name,
                base64Length: profileImageBase64.length,
            })
        }

        // Update user profile
        console.assert(user._id, 'Avatar -> base64Strategy: user._id is required')
        const response = await api(ENDPOINT, { _id: user._id, profileImage: profileImageBase64 })

        if (response?.error) {
            throw new Error(response.error)
        }

        // Call success callback if provided
        if (callbacks.onSuccess) {
            await callbacks.onSuccess()
        }
    },
}

const s3Strategy: ImageStrategy = {
    getImageUrl: async (user: IUser) => {
        if (!user?.profileImage) return null

        const key = user.profileImage

        // Early return if this is a base64 image URL (not an S3 key)
        if (isBase64Image(key)) {
            return key
        }

        // Check if info is in localStorage
        const cachedData = localStorage.getItem(key)
        if (cachedData) {
            try {
                const { signedUrl, timestamp } = JSON.parse(cachedData)
                if (differenceInHours(new Date(), new Date(timestamp)) < 12) {
                    return signedUrl
                } else {
                    localStorage.removeItem(key)
                }
            } catch (error) {
                // Handle corrupt localStorage data gracefully
                localStorage.removeItem(key)
            }
        }

        try {
            // Only try to fetch from S3 if it looks like a valid ObjectId
            if (isLikelyObjectId(key)) {
                const response = await S3Service.getFileUrlFromS3(key)

                localStorage.setItem(
                    key,
                    JSON.stringify({
                        signedUrl: response?.signedUrl,
                        contentType: response?.contentType,
                        timestamp: new Date().toISOString(),
                    })
                )

                return response.signedUrl
            } else {
                console.warn('S3 strategy received invalid key format:', key.substring(0, 30) + '...')
                return null
            }
        } catch (err) {
            console.error('Error fetching S3 image:', err)
            return null
        }
    },

    uploadImage: async (file: File, user: IUser, callbacks: ImageUploadCallbacks) => {
        // Upload to S3
        const s3ObjectId = await S3Service.uploadFileToS3(file, {
            isPublic: true,
            isViewableByAnyUser: true,
        })

        // Update user profile with the new key
        await api(ENDPOINT, { _id: user._id, profileImage: s3ObjectId })

        // Convert to base64 for callback if needed
        if (callbacks.onSuccess) {
            await callbacks.onSuccess()
        }
    },
}

const hybridStrategy: ImageStrategy = {
    getImageUrl: async (user: IUser) => {
        if (!user?.profileImage) return null

        const key = user.profileImage

        // If it's already a base64 image, just return it directly
        if (isBase64Image(key)) {
            return key
        }

        // If it looks like an S3 key, try to fetch from S3 first
        if (isLikelyObjectId(key)) {
            try {
                // Check localStorage cache first
                const cachedData = localStorage.getItem(`s3_cache_${key}`)
                if (cachedData) {
                    try {
                        const { signedUrl, timestamp } = JSON.parse(cachedData)
                        if (differenceInHours(new Date(), new Date(timestamp)) < 12) {
                            return signedUrl
                        } else {
                            localStorage.removeItem(`s3_cache_${key}`)
                        }
                    } catch {
                        localStorage.removeItem(`s3_cache_${key}`)
                    }
                }

                // Try S3 fetch
                const response = await S3Service.getFileUrlFromS3(key)

                // Cache the result
                localStorage.setItem(
                    `s3_cache_${key}`,
                    JSON.stringify({
                        signedUrl: response?.signedUrl,
                        contentType: response?.contentType,
                        timestamp: new Date().toISOString(),
                    })
                )

                return response.signedUrl
            } catch (error) {
                // console.warn('S3 fetch failed, checking for base64 fallback', error)

                // Try to get base64 fallback if it exists
                try {
                    // Check if we have a fallback stored
                    const fallbackData = localStorage.getItem(`base64_fallback_${key}`)
                    if (fallbackData) {
                        return fallbackData
                    }
                } catch {
                    // No fallback available
                }

                return null
            }
        }

        // Not a recognizable format
        return null
    },

    uploadImage: async (file: File, user: IUser, callbacks: ImageUploadCallbacks) => {
        // Always process and prepare the base64 version
        const blob = await processImageForUpload(file)
        const base64Version = await convertBlobToBase64(blob)

        // Try S3 upload first
        try {
            const s3ObjectId = await S3Service.uploadFileToS3(file, {
                isPublic: true,
                isViewableByAnyUser: true,
            })

            // Store the base64 version as a fallback
            localStorage.setItem(`base64_fallback_${s3ObjectId}`, base64Version)

            // Update user profile with the S3 key
            await api(ENDPOINT, { _id: user._id, profileImage: s3ObjectId })
        } catch (error) {
            // console.warn('S3 upload failed, falling back to base64', error)

            // Fall back to base64 if S3 fails
            await api(ENDPOINT, { _id: user._id, profileImage: base64Version })
        }

        // Call success callback if provided
        if (callbacks.onSuccess) {
            await callbacks.onSuccess()
        }
    },
}

// Strategy-specific component variants
function Base64Avatar(props: AvatarBaseProps) {
    return <AvatarBase {...props} strategy={base64Strategy} />
}

function S3Avatar(props: AvatarBaseProps) {
    return <AvatarBase {...props} strategy={s3Strategy} />
}

function HybridAvatar(props: AvatarBaseProps) {
    return <AvatarBase {...props} strategy={hybridStrategy} />
}

// Default Avatar component uses environment setting or falls back to hybrid
function Avatar(props: AvatarBaseProps) {
    const strategyFromEnv = import.meta.env.VITE_PROFILE_IMAGE_STRATEGY as 'base64' | 's3' | 'hybrid' | 'auto'

    // Choose the appropriate strategy
    const getDefaultStrategy = (): ImageStrategy => {
        switch (strategyFromEnv) {
            case 'base64':
                return base64Strategy
            case 's3':
                return s3Strategy
            case 'hybrid':
            case 'auto':
            default:
                return hybridStrategy
        }
    }

    return <AvatarBase {...props} strategy={getDefaultStrategy()} />
}

// Attach variants to the main Avatar object
Avatar.Base = AvatarBase
Avatar.Base64 = Base64Avatar
Avatar.S3 = S3Avatar
Avatar.Hybrid = HybridAvatar

export default Avatar
