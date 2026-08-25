import React from 'react';
import clsx from 'clsx';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * FeatureCard component with centered icon badge, smooth lift animation,
 * and adaptive theme styling for Cascade City.
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  badge,
  badgeColor,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'group relative bg-white border border-charcoal-900/10 rounded-2xl p-8 flex flex-col items-center text-center shadow-command',
        'transition-all duration-300 ease-out',
        'hover:shadow-command-lg hover:-translate-y-2 hover:border-charcoal-900/25',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {badge && (
        <span
          className={clsx(
            'absolute top-4 right-4 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
            badgeColor || 'bg-cream-100 text-charcoal-700 border-charcoal-900/10'
          )}
        >
          {badge}
        </span>
      )}

      {/* Icon Container with subtle scale on hover */}
      <div className="mb-6 p-4 rounded-full bg-cream-100 text-charcoal-900 border border-charcoal-900/10 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-cream-200">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold font-mono text-charcoal-900 mb-2 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed font-sans">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
