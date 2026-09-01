'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { SOCIAL_PLATFORMS, formatSocialUrl, formatSocialDisplay } from '@/lib/social';
import { getSocialIcon } from './SocialIcons';
import { cn } from '@/lib/utils';

export interface SocialLinksProps {
  socials: {
    instagram?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
    spotify?: string | null;
    telegram?: string | null;
    discord?: string | null;
    website?: string | null;
  };
  variant?: 'pills' | 'buttons' | 'compact' | 'cards';
  showLabels?: boolean;
  className?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  socials,
  variant = 'pills',
  showLabels = true,
  className = '',
}) => {
  const activeSocials = SOCIAL_PLATFORMS.filter((platform) => {
    const value = socials[platform.id as keyof typeof socials];
    return value && value.trim().length > 0;
  }).map((platform) => {
    const rawValue = socials[platform.id as keyof typeof socials] as string;
    return {
      ...platform,
      rawValue,
      url: formatSocialUrl(platform.id, rawValue),
      display: formatSocialDisplay(platform.id, rawValue),
    };
  });

  if (activeSocials.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center flex-wrap gap-2', className)}>
        {activeSocials.map((social) => (
          <a
            key={social.id}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${social.label}: ${social.display}`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground bg-foreground/5 hover:bg-foreground/10 transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              ['--hover-color' as any]: social.brandColor,
            }}
          >
            {getSocialIcon(social.id, { size: 16 })}
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3', className)}>
        {activeSocials.map((social, index) => (
          <motion.a
            key={social.id}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass-card-rounded p-3 flex items-center justify-between group hover:border-primary/40 hover:bg-foreground/5 transition-all duration-300"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200"
                style={{ backgroundColor: social.brandHoverBg, color: social.brandColor }}
              >
                {getSocialIcon(social.id, { size: 18 })}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  {social.label}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {social.display}
                </div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 -translate-x-1 transition-all" />
          </motion.a>
        ))}
      </div>
    );
  }

  // Default 'pills' or 'buttons'
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {activeSocials.map((social, index) => (
        <motion.a
          key={social.id}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: index * 0.03 }}
          className={cn(
            'group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
            'bg-foreground/5 hover:bg-foreground/10 border-border/40 hover:border-foreground/20 text-foreground'
          )}
        >
          <span
            className="flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{ color: social.brandColor }}
          >
            {getSocialIcon(social.id, { size: 15 })}
          </span>
          
          {showLabels && (
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {social.display}
            </span>
          )}

          <ExternalLink className="w-3 h-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.a>
      ))}
    </div>
  );
};

export default SocialLinks;
