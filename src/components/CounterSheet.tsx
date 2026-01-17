import { useState } from 'react';
import { Player } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';
import { X, Skull, Sparkles, Zap, Swords, Crown, Shield } from 'lucide-react';

type CounterType = 'poison' | 'experience' | 'energy' | 'commander';

interface CounterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  allPlayers: Player[];
  isMonarch: boolean;
  hasInitiative: boolean;
  onPoisonChange: (delta: number) => void;
  onExperienceChange: (delta: number) => void;
  onEnergyChange: (delta: number) => void;
  onCommanderDamageChange: (fromPlayerId: number, delta: number) => void;
  onToggleMonarch: () => void;
  onToggleInitiative: () => void;
  rotation?: number;
}

export function CounterSheet({
  isOpen,
  onClose,
  player,
  allPlayers,
  isMonarch,
  hasInitiative,
  onPoisonChange,
  onExperienceChange,
  onEnergyChange,
  onCommanderDamageChange,
  onToggleMonarch,
  onToggleInitiative,
  rotation = 0,
}: CounterSheetProps) {
  const [activeTab, setActiveTab] = useState<CounterType>('poison');
  const opponents = allPlayers.filter(p => p.id !== player.id);

  if (!isOpen) return null;

  const counters = [
    { 
      id: 'poison' as const, 
      label: 'Poison', 
      icon: Skull, 
      value: player.poison,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      onChange: onPoisonChange,
    },
    { 
      id: 'experience' as const, 
      label: 'Experience', 
      icon: Sparkles, 
      value: player.experience,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      onChange: onExperienceChange,
    },
    { 
      id: 'energy' as const, 
      label: 'Energy', 
      icon: Zap, 
      value: player.energy,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      onChange: onEnergyChange,
    },
    { 
      id: 'commander' as const, 
      label: 'Commander', 
      icon: Swords, 
      value: Object.values(player.commanderDamage).reduce((a, b) => a + b, 0),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      onChange: () => {},
    },
  ];

  const activeCounter = counters.find(c => c.id === activeTab);

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="w-full max-w-xs px-3">
        {/* Counter tabs - compact horizontal */}
        <div className="flex justify-center gap-1.5 mb-4">
          {counters.map((counter) => {
            const Icon = counter.icon;
            const isActive = activeTab === counter.id;
            return (
              <button
                key={counter.id}
                onClick={() => setActiveTab(counter.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all',
                  isActive ? counter.bgColor : 'bg-white/5 active:bg-white/10'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? counter.color : 'text-white/50')} />
                <span className={cn('text-[10px] font-medium', isActive ? counter.color : 'text-white/50')}>
                  {counter.value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Counter editor - compact for mobile */}
        {activeTab !== 'commander' && activeCounter && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => activeCounter.onChange(-1)}
              className="w-14 h-14 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center text-2xl text-white transition-all active:scale-95"
            >
              −
            </button>
            <div className="flex flex-col items-center min-w-[80px]">
              <activeCounter.icon className={cn('w-6 h-6 mb-1', activeCounter.color)} />
              <span className={cn('font-display text-5xl', activeCounter.color)}>
                {activeCounter.value}
              </span>
              <span className="text-xs text-white/50 mt-0.5">{activeCounter.label}</span>
            </div>
            <button
              onClick={() => activeCounter.onChange(1)}
              className="w-14 h-14 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center text-2xl text-white transition-all active:scale-95"
            >
              +
            </button>
          </div>
        )}

        {/* Commander damage editor - compact */}
        {activeTab === 'commander' && (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            <div className="text-center text-white/60 text-xs mb-2">
              Commander damage from:
            </div>
            {opponents.map((opp) => {
              const dmg = player.commanderDamage[opp.id] || 0;
              return (
                <div 
                  key={opp.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${opp.color})` }}
                    />
                    <span className="text-white text-sm font-medium truncate max-w-[80px]">{opp.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCommanderDamageChange(opp.id, -1)}
                      className="w-9 h-9 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center text-lg text-white"
                    >
                      −
                    </button>
                    <span className="font-display text-xl text-orange-400 w-6 text-center">
                      {dmg}
                    </span>
                    <button
                      onClick={() => onCommanderDamageChange(opp.id, 1)}
                      className="w-9 h-9 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center text-lg text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Status toggles - compact */}
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={onToggleMonarch}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              isMonarch 
                ? 'bg-yellow-500/30 text-yellow-300' 
                : 'bg-white/10 text-white/60 active:bg-white/20'
            )}
          >
            <Crown className="w-4 h-4" fill={isMonarch ? 'currentColor' : 'none'} />
            Monarch
          </button>
          <button
            onClick={onToggleInitiative}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              hasInitiative 
                ? 'bg-purple-500/30 text-purple-300' 
                : 'bg-white/10 text-white/60 active:bg-white/20'
            )}
          >
            <Shield className="w-4 h-4" fill={hasInitiative ? 'currentColor' : 'none'} />
            Initiative
          </button>
        </div>
      </div>
    </div>
  );
}
