import React from 'react';

interface UserAvatarProps {
  name?: string;
  photo?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'Usuario',
  photo,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white/10 dark:ring-slate-800 ${className}`}
        onError={(e) => {
          // Fallback if image fails
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // Generate deterministic subtle background color based on name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hues = [210, 260, 330, 160, 25, 190];
  const hue = hues[hash % hues.length];

  return (
    <div
      style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white shadow-sm ring-2 ring-white/10 select-none ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};
