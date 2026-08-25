import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './StrokeText.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_TEXT = 'Draw Attention';

export interface StrokeTextProps {
  text?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
  trigger?: 'mount' | 'hover' | 'scroll' | 'loop';
  fillMode?: 'fade' | 'wipe' | 'none';
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  reverse?: boolean;
  replayOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const StrokeText: React.FC<StrokeTextProps> = ({
  text = DEFAULT_TEXT,
  strokeColor = '#A78BFA',
  fillColor = '#F8FAFC',
  strokeWidth = 1.8,
  drawDuration = 1.4,
  fillDelay = 0.1,
  delay = 0,
  stagger = 0.04,
  ease = 'power2.out',
  trigger = 'mount',
  fillMode = 'fade',
  fontSize = 128,
  fontWeight = 800,
  letterSpacing = -2,
  reverse = false,
  replayOnHover = true,
  className = '',
  style = {},
}) => {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const strokeTextRef = useRef<SVGTextElement | null>(null);
  const wipeRectRef = useRef<SVGRectElement | null>(null);

  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const rawId = useId();
  const wipeId = `stroke-text-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const characters = useMemo(() => Array.from(String(text ?? '')), [text]);

  const dash = Math.max(fontSize * 8, 300);

  const fontStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`,
    }),
    [fontSize, fontWeight, letterSpacing]
  );

  useIsomorphicLayoutEffect(() => {
    const node = strokeTextRef.current;
    if (!node) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled || !strokeTextRef.current) return;
      let bbox: DOMRect | SVGRect;
      try {
        bbox = strokeTextRef.current.getBBox();
      } catch {
        return;
      }
      if (!bbox || !bbox.width) return;

      const pad = Math.max(Number(strokeWidth) || 1, fontSize * 0.12);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2,
      };

      setBox((prev) =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5
          ? prev
          : next
      );
    };

    measure();
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(measure).catch(() => {});
    }

    // Fallback measurement if fonts or bbox were delayed
    const timer = setTimeout(measure, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [characters, fontSize, fontWeight, letterSpacing, strokeWidth]);

  useEffect(() => {
    const root = rootRef.current;
    if (typeof window === 'undefined' || !root || !box) return undefined;

    const strokes = gsap.utils.toArray(root.querySelectorAll('[data-stroke-char]'));
    const fills = gsap.utils.toArray(root.querySelectorAll('[data-fill-char]'));
    const wipe = wipeRectRef.current;
    if (!strokes.length) return undefined;

    const fillEnabled = fillMode !== 'none';
    const useWipe = fillEnabled && fillMode === 'wipe';
    const fillDuration = Math.max(0.4, drawDuration * 0.45);
    const staggerConfig = reverse ? { each: stagger, from: 'end' as const } : stagger;
    const targets = [...strokes, ...fills, wipe].filter(Boolean);

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash, opacity: 1 });
      gsap.set(fills, { opacity: 0 });
      if (wipe) gsap.set(wipe, { attr: { width: 0 } });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0, opacity: 1 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: fillEnabled ? box.width : 0 } });
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setEnd();
      return () => {
        gsap.killTweensOf(targets);
      };
    }

    const build = () => {
      setStart();
      const tl = gsap.timeline({
        paused: true,
        delay,
        repeat: trigger === 'loop' ? -1 : 0,
        repeatDelay: trigger === 'loop' ? 1.0 : 0,
        defaults: { overwrite: 'auto' },
      });

      tl.to(strokes, { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig as any }, 0);

      if (useWipe && wipe) {
        tl.to(
          wipe,
          { attr: { width: box.width }, duration: fillDuration, ease: 'power2.inOut' },
          drawDuration + fillDelay
        );
      } else if (fillEnabled) {
        tl.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig as any },
          drawDuration + fillDelay
        );
      }

      return tl;
    };

    let timeline: gsap.core.Timeline | null = null;
    let scrollTrigger: ScrollTrigger | null = null;
    let removeHover: (() => void) | null = null;

    if (trigger === 'hover') {
      setEnd();
      const play = () => {
        timeline?.kill();
        timeline = build();
        timeline.play(0);
      };
      root.addEventListener('pointerenter', play);
      removeHover = () => root.removeEventListener('pointerenter', play);
    } else {
      timeline = build();
      if (trigger === 'scroll') {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: 'top 85%',
          once: true,
          onEnter: () => timeline?.play(0),
        });
      } else {
        timeline.play(0);
      }

      if (replayOnHover) {
        const playOnHover = () => {
          timeline?.kill();
          timeline = build();
          timeline.play(0);
        };
        root.addEventListener('pointerenter', playOnHover);
        removeHover = () => root.removeEventListener('pointerenter', playOnHover);
      }
    }

    return () => {
      removeHover?.();
      scrollTrigger?.kill();
      timeline?.kill();
      gsap.killTweensOf(targets);
    };
  }, [box, dash, drawDuration, fillDelay, delay, stagger, ease, trigger, fillMode, reverse, replayOnHover]);

  const viewBox = box ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 ${-fontSize} 600 ${fontSize * 1.3}`;

  return (
    <span
      ref={rootRef}
      className={`stroke-text ${trigger === 'hover' || replayOnHover ? 'stroke-text--hover' : ''} ${className}`.trim()}
      style={{ ...(style as any), '--stroke-text-height': `${Math.round(fontSize * 1.25)}px` }}
      role="img"
      aria-label={String(text ?? '')}
    >
      <svg className="stroke-text__svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {fillMode === 'wipe' && box && (
          <defs>
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect ref={wipeRectRef} x={box.x} y={box.y} width="0" height={box.height} />
            </clipPath>
          </defs>
        )}

        <text
          ref={strokeTextRef}
          className="stroke-text__stroke"
          x="0"
          y="0"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={fontStyle}
        >
          {characters.map((char, index) => (
            <tspan data-stroke-char key={`s-${index}`}>
              {char}
            </tspan>
          ))}
        </text>

        <text
          className="stroke-text__fill"
          x="0"
          y="0"
          fill={fillColor}
          stroke="none"
          style={{ ...fontStyle, opacity: 0 }}
          clipPath={fillMode === 'wipe' && box ? `url(#${wipeId})` : undefined}
        >
          {characters.map((char, index) => (
            <tspan data-fill-char key={`f-${index}`}>
              {char}
            </tspan>
          ))}
        </text>
      </svg>
    </span>
  );
};

export default StrokeText;
