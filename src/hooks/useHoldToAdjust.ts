import { useRef, useCallback, useEffect } from 'react';

interface UseHoldToAdjustOptions {
  enabled: boolean;
  onAdjust: (delta: number) => void;
  initialDelay?: number;
  initialSpeed?: number;
  acceleratedSpeed?: number;
  accelerateAfterCount?: number;
}

export function useHoldToAdjust({
  enabled,
  onAdjust,
  initialDelay = 250,
  initialSpeed = 150,
  acceleratedSpeed = 80,
  accelerateAfterCount = 5,
}: UseHoldToAdjustOptions) {
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const start = useCallback((delta: number) => {
    if (!enabled) return;
    stop();
    
    holdTimeoutRef.current = setTimeout(() => {
      onAdjust(delta);
      let count = 0;
      
      holdIntervalRef.current = setInterval(() => {
        onAdjust(delta);
        count++;
        
        if (count === accelerateAfterCount && initialSpeed > acceleratedSpeed) {
          clearInterval(holdIntervalRef.current!);
          holdIntervalRef.current = setInterval(() => onAdjust(delta), acceleratedSpeed);
        }
      }, initialSpeed);
    }, initialDelay);
  }, [enabled, onAdjust, initialDelay, initialSpeed, acceleratedSpeed, accelerateAfterCount, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop };
}
