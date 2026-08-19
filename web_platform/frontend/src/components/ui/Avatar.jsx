import React from 'react';
import { getActiveUserAvatar, getAvatarById, svgToDataUri } from '../../utils/avatarCatalog';

export function Avatar({ src, avatarId, user, alt = 'Avatar', name = '', size = 'md', className = '' }) {
  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-28 h-28 text-xl"
  };

  let imageSrc = src;

  if (!imageSrc && avatarId) {
    const av = getAvatarById(avatarId);
    if (av) imageSrc = av.url || svgToDataUri(av.svg);
  }

  if (!imageSrc) {
    const active = getActiveUserAvatar(user);
    if (active) imageSrc = active.srcUrl || active.url || svgToDataUri(active.svg);
  }

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-slate-900 shadow-md overflow-hidden shrink-0 ring-2 ring-white/20 ${sizeStyles[size] || sizeStyles.md} ${className}`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover select-none transition-transform hover:scale-105"
          onError={(e) => {
            // Fallback if image fails to load
            if (avatarId || user) {
              const av = getAvatarById(avatarId || 'male');
              e.target.src = svgToDataUri(av.svg);
            }
          }}
        />
      ) : (
        <span className="font-bold text-white">{getInitials(name)}</span>
      )}
    </div>
  );
}
