import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
}

/**
 * Card surface used across the dashboard and guide lists. When it's given an
 * onClick (i.e. it's acting as a button rather than just a container — see
 * DashboardButtons), it also picks up real button semantics: keyboard focus,
 * Enter/Space activation, a visible focus ring, and a hover lift. Without
 * this, a mouse user sees "cursor-pointer" and assumes it's clickable while
 * a keyboard user has no way to reach it at all — exactly the kind of gap
 * that makes an app feel unfinished rather than premium.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor,
  onClick,
  onKeyDown,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const { themeMode } = useStore();
  const interactive = !!onClick;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      // Every real caller (see DashboardButtons) ignores the event object
      // entirely and just navigates, so synthesizing a MouseEvent from a
      // KeyboardEvent here is safe in practice even though the two aren't
      // really the same shape.
      onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  const effectiveSpotlightColor =
    spotlightColor || (themeMode === 'dark' ? 'rgba(74, 159, 224, 0.15)' : 'rgba(74, 159, 224, 0.08)');

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => setOpacity(1)}
      onBlur={() => setOpacity(0)}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ease-out',
        'bg-white dark:bg-dark-card border-slate-200 dark:border-white/5',
        interactive && 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-centri-300 dark:hover:border-centri-700/50',
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${effectiveSpotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
};
