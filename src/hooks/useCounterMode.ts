import { useState, useCallback, useRef, useEffect } from 'react';
import { Player } from '@/lib/roomUtils';
import { haptics } from '@/lib/haptics';

export type CounterMode = 'life' | 'poison' | 'experience' | 'energy' | 'commander';

interface UseCounterModeOptions {
  player: Player;
  isAdmin: boolean;
  onLifeChange: (delta: number) => void;
  onPoisonChange: (delta: number) => void;
  onExperienceChange: (delta: number) => void;
  onEnergyChange: (delta: number) => void;
}

export function useCounterMode({
  player,
  isAdmin,
  onLifeChange,
  onPoisonChange,
  onExperienceChange,
  onEnergyChange,
}: UseCounterModeOptions) {
  const [mode, setMode] = useState<CounterMode>('life');
  const [animating, setAnimating] = useState(false);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const lastActionRef = useRef(0);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCommanderDamage = Object.values(player.commanderDamageReceived ?? {}).reduce((a, b) => a + b, 0);

  const getCurrentValue = useCallback(() => {
    switch (mode) {
      case 'poison': return player.poison;
      case 'experience': return player.experience;
      case 'energy': return player.energy;
      case 'commander': return totalCommanderDamage;
      default: return player.life;
    }
  }, [mode, player, totalCommanderDamage]);

  const handleChange = useCallback((delta: number, fromHold = false) => {
    if (!isAdmin) return;
    
    if (!fromHold) {
      const now = Date.now();
      if (now - lastActionRef.current < 100) return;
      lastActionRef.current = now;
    }
    
    haptics.light();

    switch (mode) {
      case 'poison': onPoisonChange(delta); break;
      case 'experience': onExperienceChange(delta); break;
      case 'energy': onEnergyChange(delta); break;
      default: onLifeChange(delta); break;
    }

    setLastDelta(delta);
    setAnimating(true);
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      setAnimating(false);
      setLastDelta(null);
    }, 300);
  }, [isAdmin, mode, onLifeChange, onPoisonChange, onExperienceChange, onEnergyChange]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return {
    mode,
    setMode,
    currentValue: getCurrentValue(),
    totalCommanderDamage,
    handleChange,
    animating,
    lastDelta,
  };
}
