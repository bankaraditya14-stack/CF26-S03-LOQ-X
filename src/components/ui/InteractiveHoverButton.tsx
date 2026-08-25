import React from 'react';
import { ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: React.ReactNode;
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = 'LAUNCH SIMULATOR', icon, className, children, ...props }, ref) => {
  const displayText = children || text;

  return (
    <button
      ref={ref}
      className={clsx(
        'group relative inline-flex items-center justify-center cursor-pointer overflow-hidden rounded-full border border-charcoal-900/15 bg-white px-6 py-2.5 text-center font-mono font-bold tracking-wider text-charcoal-900 transition-all duration-300 hover:border-charcoal-900 shadow-sm',
        className
      )}
      {...props}
    >
      {/* Resting text state */}
      <span className="inline-flex items-center gap-2 translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        <span className="h-2 w-2 rounded-full bg-charcoal-900 transition-all duration-300" />
        <span>{displayText}</span>
      </span>

      {/* Hovered text state with ArrowRight */}
      <div className="absolute inset-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-cream-100 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{displayText}</span>
        {icon || <ArrowRight className="w-4 h-4 text-cream-100" />}
      </div>

      {/* Expanding background dot layer */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-charcoal-900 transition-all duration-500 ease-out group-hover:left-0 group-hover:top-0 group-hover:translate-y-0 group-hover:h-full group-hover:w-full group-hover:scale-[2.5] group-hover:bg-charcoal-900 pointer-events-none"
        aria-hidden="true"
      />
    </button>
  );
});

InteractiveHoverButton.displayName = 'InteractiveHoverButton';

export default InteractiveHoverButton;
