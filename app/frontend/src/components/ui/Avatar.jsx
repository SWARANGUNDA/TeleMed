import React from 'react';
import { getActiveUserAvatar, getAvatarById, svgToDataUri, hasUserUpdatedProfile } from '../../utils/avatarCatalog';

export function Avatar({ src, avatarId, user, alt = 'Avatar', name = '', size = 'md', className = '' }) {
  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-28 h-28 text-xl"
  };

  const emojiSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
    xl: "text-5xl"
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2).toUpperCase();
  };

  const activeAv = avatarId ? getAvatarById(avatarId) : getActiveUserAvatar(user);
  const isProfileUpdated = Boolean(src || avatarId || user?.avatar || hasUserUpdatedProfile(user));

  let imageSrc = src || (activeAv?.url || (activeAv?.svg ? svgToDataUri(activeAv.svg) : null));
  const emoji = activeAv?.emoji || '👤';
  const displayName = name || user?.full_name || user?.name || user?.email || 'User';

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-slate-800 via-indigo-900 to-blue-900 shadow-md overflow-hidden shrink-0 ring-2 ring-white/20 select-none ${sizeStyles[size] || sizeStyles.md} ${className}`}>
      {imageSrc && !imgError && isProfileUpdated ? (
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : isProfileUpdated && emoji ? (
        <span className={`${emojiSizes[size] || 'text-base'} leading-none select-none`}>{emoji}</span>
      ) : (
        <span className="font-extrabold text-white tracking-wider font-sans select-none">{getInitials(displayName)}</span>
      )}
    </div>
  );
}
