import { useEffect, useRef } from 'react';

export const EMBED_RESIZE_MESSAGE = 'lifelink:embed-size';

export interface EmbedSizeMessage {
  type: typeof EMBED_RESIZE_MESSAGE;
  /** Room the widget is rendering, so parents can target the right iframe. */
  roomId?: string;
  width: number;
  height: number;
}

/**
 * Observes an element and posts its content size to the parent window so an
 * embedding page can resize the iframe to fit exactly. No-ops when the page is
 * not framed.
 */
export function useIframeAutoResize(
  enabled: boolean,
  roomId?: string,
): (node: HTMLElement | null) => void {
  const nodeRef = useRef<HTMLElement | null>(null);
  const lastRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!enabled || !node) return;
    if (typeof window === 'undefined' || window.parent === window) return;

    const post = (width: number, height: number) => {
      const w = Math.ceil(width);
      const h = Math.ceil(height);
      const last = lastRef.current;
      if (last && last.width === w && last.height === h) return;
      lastRef.current = { width: w, height: h };
      const message: EmbedSizeMessage = { type: EMBED_RESIZE_MESSAGE, roomId, width: w, height: h };
      try {
        window.parent.postMessage(message, '*');
      } catch {
        // Cross-origin parents that block postMessage are ignored.
      }
    };

    const measure = () => {
      const rect = node.getBoundingClientRect();
      post(rect.width || node.scrollWidth, node.scrollHeight || rect.height);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('load', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('load', measure);
    };
  }, [enabled, roomId]);

  return (node: HTMLElement | null) => {
    nodeRef.current = node;
  };
}
