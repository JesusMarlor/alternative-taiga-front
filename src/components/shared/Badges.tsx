import React from 'react';

interface StatusBadgeProps {
  name: string;
  color?: string;
  isClosed?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  name,
  color = '#70728F',
  isClosed = false,
  className = '',
}) => {
  return (
    <span
      style={{
        backgroundColor: `${color}18`,
        color: color,
        borderColor: `${color}35`,
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
        isClosed ? 'opacity-80 line-through' : ''
      } ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
        style={{ backgroundColor: color }}
      />
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  name: string;
  color?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  name,
  color = '#94a3b8',
}) => {
  return (
    <span
      style={{
        color: color,
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
      }}
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border"
    >
      {name}
    </span>
  );
};

interface SeverityBadgeProps {
  name: string;
  color?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  name,
  color = '#64748b',
}) => {
  return (
    <span
      style={{
        color: color,
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
      }}
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border"
    >
      {name}
    </span>
  );
};
