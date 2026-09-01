export interface SocialPlatformConfig {
  id: 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'spotify' | 'telegram' | 'discord' | 'website';
  label: string;
  placeholder: string;
  baseUrlPrefix?: string;
  brandColor: string;
  brandHoverBg: string;
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    placeholder: '@username or URL',
    baseUrlPrefix: 'https://instagram.com/',
    brandColor: '#E1306C',
    brandHoverBg: 'rgba(225, 48, 108, 0.15)',
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    placeholder: '@handle or URL',
    baseUrlPrefix: 'https://x.com/',
    brandColor: '#1DA1F2',
    brandHoverBg: 'rgba(29, 161, 242, 0.15)',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    placeholder: '@username or URL',
    baseUrlPrefix: 'https://tiktok.com/@',
    brandColor: '#00F2FE',
    brandHoverBg: 'rgba(0, 242, 254, 0.15)',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    placeholder: '@channel or URL',
    baseUrlPrefix: 'https://youtube.com/@',
    brandColor: '#FF0000',
    brandHoverBg: 'rgba(255, 0, 0, 0.15)',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    placeholder: 'Artist link or URI',
    baseUrlPrefix: 'https://open.spotify.com/artist/',
    brandColor: '#1DB954',
    brandHoverBg: 'rgba(29, 185, 84, 0.15)',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    placeholder: '@username or t.me link',
    baseUrlPrefix: 'https://t.me/',
    brandColor: '#229ED9',
    brandHoverBg: 'rgba(34, 158, 217, 0.15)',
  },
  {
    id: 'discord',
    label: 'Discord',
    placeholder: 'Server invite link or username',
    baseUrlPrefix: 'https://discord.gg/',
    brandColor: '#5865F2',
    brandHoverBg: 'rgba(88, 101, 242, 0.15)',
  },
  {
    id: 'website',
    label: 'Personal Website',
    placeholder: 'https://yourportfolio.com',
    baseUrlPrefix: 'https://',
    brandColor: '#10B981',
    brandHoverBg: 'rgba(16, 185, 129, 0.15)',
  },
];

export function formatSocialUrl(platformId: string, value: string): string {
  if (!value || !value.trim()) return '';
  const trimmed = value.trim();

  // If already an absolute URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Remove leading @ for URL construction
  const cleanHandle = trimmed.replace(/^@+/, '');

  switch (platformId) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'twitter':
      return `https://x.com/${cleanHandle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${cleanHandle}`;
    case 'youtube':
      if (cleanHandle.startsWith('channel/') || cleanHandle.startsWith('c/')) {
        return `https://youtube.com/${cleanHandle}`;
      }
      return `https://youtube.com/@${cleanHandle}`;
    case 'spotify':
      if (cleanHandle.includes('spotify.com')) {
        return `https://${cleanHandle}`;
      }
      return `https://open.spotify.com/artist/${cleanHandle}`;
    case 'telegram':
      return `https://t.me/${cleanHandle}`;
    case 'discord':
      if (cleanHandle.startsWith('discord.gg/') || cleanHandle.startsWith('discord.com/')) {
        return `https://${cleanHandle}`;
      }
      return `https://discord.gg/${cleanHandle}`;
    case 'website':
    default:
      return `https://${cleanHandle}`;
  }
}

export function formatSocialDisplay(platformId: string, value: string): string {
  if (!value) return '';
  const trimmed = value.trim();

  // Strip protocol and domain for compact display if helpful
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
      if (platformId === 'website') {
        return url.hostname + (path ? `/${path}` : '');
      }
      if (path) {
        return `@${path.replace(/^@/, '')}`;
      }
      return url.hostname;
    }
  } catch {
    // fallback
  }

  if (trimmed.startsWith('@')) return trimmed;
  if (platformId === 'website') return trimmed;
  return `@${trimmed}`;
}
