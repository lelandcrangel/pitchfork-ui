import { useEffect, useRef, type CSSProperties } from 'react';

/**
 * One custom element, with its properties driven by Storybook's controls.
 *
 * The React side gets this for free: a story names a component, Storybook
 * reads its props and the panel writes them. A custom element has no props
 * Storybook can see — `argTypes` are generated from Stencil's `docs.json`
 * instead — and no React component to hand the args to, so this applies them
 * as **properties** on the element itself, which is what a consumer's
 * framework does and the one path that works for every type. An attribute
 * would stringify an array and lose a function outright.
 *
 * Two effects, deliberately, and in this order:
 *
 * 1. The markup, which only re-runs when the markup changes.
 * 2. The properties, which re-run on every control change.
 *
 * Storybook hands a fresh `args` object on every render, so folding these into
 * one effect would re-run `innerHTML` for each keystroke in the panel — tearing
 * the element down and building it again, losing whatever state it held. Split,
 * a control change writes a property onto the live element, which is exactly
 * what it is supposed to demonstrate.
 */
export interface ElementPlaygroundProps {
  /** The element the controls drive. The first one in the markup wins. */
  tag: string;
  /** A single instance, with whatever parent or children it needs to exist. */
  html: string;
  args: Record<string, unknown>;
  /** Anything HTML cannot express — see `ElementExample.setup`. */
  setup?: (root: HTMLElement) => void;
}

const stage: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--space-3)',
};

export function ElementPlayground({ tag, html, args, setup }: ElementPlaygroundProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    root.innerHTML = html;
    setup?.(root);
  }, [html, setup]);

  useEffect(() => {
    const target = stageRef.current?.querySelector(tag);
    if (!target) return;
    for (const [name, value] of Object.entries(args)) {
      // `children` is the one arg that is not a prop. An element's default
      // slot is not part of its API the way React's `children` is, so the
      // generator only offers this control where the instance holds text and
      // nothing else — assigning `textContent` to an element whose slot holds
      // child elements would delete them.
      if (name === 'children') {
        target.textContent = String(value ?? '');
        continue;
      }
      (target as unknown as Record<string, unknown>)[name] = value;
    }
  }, [tag, args]);

  return <div ref={stageRef} style={stage} />;
}
