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
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="w-full max-w-sm px-4">
        {/* Counter tabs - horizontal scroll */}
        <div className="flex justify-center gap-2 mb-6">
          {counters.map((counter) => {
            const Icon = counter.icon;
            const isActive = activeTab === counter.id;
            return (
              <button
                key={counter.id}
                onClick={() => setActiveTab(counter.id)}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all',
                  isActive ? counter.bgColor : 'bg-white/5 hover:bg-white/10'
                )}
              >
                <Icon className={cn('w-6 h-6', isActive ? counter.color : 'text-white/50')} />
                <span className={cn('text-xs font-medium', isActive ? counter.color : 'text-white/50')}>
                  {counter.value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Counter editor */}
        {activeTab !== 'commander' && activeCounter && (
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => activeCounter.onChange(-1)}
              className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-3xl text-white transition-all active:scale-95"
            >
              −
            </button>
            <div className="flex flex-col items-center">
              <activeCounter.icon className={cn('w-8 h-8 mb-2', activeCounter.color)} />
              <span className={cn('font-display text-6xl', activeCounter.color)}>
                {activeCounter.value}
              </span>
              <span className="text-sm text-white/50 mt-1">{activeCounter.label}</span>
            </div>
            <button
              onClick={() => activeCounter.onChange(1)}
              className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-3xl text-white transition-all active:scale-95"
            >
              +
            </button>
          </div>
        )}

        {/* Commander damage editor */}
        {activeTab === 'commander' && (
          <div className="space-y-3">
            <div className="text-center text-white/60 text-sm mb-4">
              Commander damage taken from:
            </div>
            {opponents.map((opp) => {
              const dmg = player.commanderDamage[opp.id] || 0;
              return (
                <div 
                  key={opp.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `hsl(${opp.color})` }}
                    />
                    <span className="text-white font-medium">{opp.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onCommanderDamageChange(opp.id, -1)}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl text-white transition-all"
                    >
                      −
                    </button>
                    <span className="font-display text-2xl text-orange-400 w-8 text-center">
                      {dmg}
                    </span>
                    <button
                      onClick={() => onCommanderDamageChange(opp.id, 1)}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl text-white transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Status toggles */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={onToggleMonarch}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
              isMonarch 
                ? 'bg-yellow-500/30 text-yellow-300' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            )}
          >
            <Crown className="w-5 h-5" fill={isMonarch ? 'currentColor' : 'none'} />
            Monarch
          </button>
          <button
            onClick={onToggleInitiative}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
              hasInitiative 
                ? 'bg-purple-500/30 text-purple-300' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            )}
          >
            <Shield className="w-5 h-5" fill={hasInitiative ? 'currentColor' : 'none'} />
            Initiative
          </button>
        </div>
      </div>
    </div>
  );
}
