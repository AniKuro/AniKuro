import React from 'react';

export const DEFAULT_ANIME_COVER =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

export const DEFAULT_ANIME_BANNER =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80';

export function getAnimeCoverImage(
  coverImage?: { extraLarge?: string; large?: string; medium?: string } | null
): string {
  if (!coverImage) return DEFAULT_ANIME_COVER;
  return coverImage.extraLarge || coverImage.large || coverImage.medium || DEFAULT_ANIME_COVER;
}

export function getAnimeBannerImage(
  bannerImage?: string | null,
  coverImage?: { extraLarge?: string; large?: string; medium?: string } | null
): string {
  if (bannerImage) return bannerImage;
  return getAnimeCoverImage(coverImage);
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  isBanner = false
) {
  const target = e.target as HTMLImageElement;
  target.onerror = null;
  target.src = isBanner ? DEFAULT_ANIME_BANNER : DEFAULT_ANIME_COVER;
}
