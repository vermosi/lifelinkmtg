import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Dices, Timer, RotateCcw, Users, PlayCircle, PauseCircle, 
  SkipForward, SkipBack, Coins, Trophy, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Room, PlayerCount } from '@/lib/roomUtils';
import { DiceRoller } from './DiceRoller';

interface ToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  isAdmin: boolean;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onSetActivePlayer: (index: number) => void;
  onToggleGameTimer: () => void;
  onResetGameTimer: () => void;
  onResetGame: () => void;
  onSetPlayerCount: (count: PlayerCount) => void;
}

type DrawerTab = 'dice' | 'settings';

interface HighRollResult {
  playerId: number;
  roll: number;
}

function ToolsDrawerContent({
  isOpen,
  onClose,
  room,
  isAdmin,
  onNextTurn,
  onPreviousTurn,
  onSetActivePlayer,
  onToggleGameTimer,
  onResetGameTimer,
  onResetGame,
  onSetPlayerCount,
}: ToolsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('dice');
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [highRollResults, setHighRollResults] = useState<HighRollResult[]>([]);
  const [highRollWinner, setHighRollWinner] = useState<number | null>(null);
  const [isRollingHigh, setIsRollingHigh] = useState(false);
  
  const coinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const highRollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (coinIntervalRef.current) clearInterval(coinIntervalRef.current);
      if (highRollTimeoutRef.current) clearTimeout(highRollTimeoutRef.current);
    };
  }, []);

  // Format elapsed time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate current elapsed time
  const getElapsedTime = useCallback(() => {
    if (!room.gameTimer.running || !room.gameTimer.startedAt) {
      return room.gameTimer.elapsedMs;
    }
    return room.gameTimer.elapsedMs + (Date.now() - room.gameTimer.startedAt);
  }, [room.gameTimer]);

  const [displayTime, setDisplayTime] = useState(getElapsedTime());

  useEffect(() => {
    if (room.gameTimer.running) {
      const interval = setInterval(() => {
        setDisplayTime(getElapsedTime());
      }, 100);
      return () => clearInterval(interval);
    } else {
      setDisplayTime(room.gameTimer.elapsedMs);
    }
  }, [room.gameTimer.running, room.gameTimer.elapsedMs, getElapsedTime]);

  // Coin flip
  const flipCoin = useCallback(() => {
    if (coinIntervalRef.current) clearInterval(coinIntervalRef.current);
    setCoinFlipping(true);
    setCoinResult(null);
    
    let count = 0;
    coinIntervalRef.current = setInterval(() => {
      setCoinResult(Math.random() > 0.5 ? 'heads' : 'tails');
      count++;
      if (count > 10) {
        if (coinIntervalRef.current) clearInterval(coinIntervalRef.current);
        coinIntervalRef.current = null;
        setCoinResult(Math.random() > 0.5 ? 'heads' : 'tails');
        setCoinFlipping(false);
      }
    }, 80);
  }, []);

  // High roll for starting player
  const highRoll = () => {
    setIsRollingHigh(true);
    setHighRollResults([]);
    setHighRollWinner(null);

    const rolls: { playerId: number; roll: number }[] = [];
    let currentPlayer = 0;

    const rollNext = () => {
      if (currentPlayer >= room.players.length) {
        // All rolled, find winner
        const maxRoll = Math.max(...rolls.map(r => r.roll));
        const winners = rolls.filter(r => r.roll === maxRoll);
        
        if (winners.length > 1) {
          // Tie - could implement re-roll, but for now just pick first
          setHighRollWinner(winners[0].playerId);
        } else {
          setHighRollWinner(winners[0].playerId);
        }
        setIsRollingHigh(false);
        return;
      }

      const player = room.players[currentPlayer];
      let animCount = 0;
      const animInterval = setInterval(() => {
        const tempRoll = Math.floor(Math.random() * 20) + 1;
        setHighRollResults([...rolls, { playerId: player.id, roll: tempRoll }]);
        animCount++;
        if (animCount > 8) {
          clearInterval(animInterval);
          const finalRoll = Math.floor(Math.random() * 20) + 1;
          rolls.push({ playerId: player.id, roll: finalRoll });
          setHighRollResults([...rolls]);
          currentPlayer++;
          setTimeout(rollNext, 300);
        }
      }, 50);
    };

    rollNext();
  };

  

  const activePlayer = room.players[room.activePlayerIndex];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-3xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <button 
            onClick={onClose}
            className="w-12 h-1.5 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-4">
          {[
            { id: 'dice' as const, label: 'Dice', icon: Dices },
            { id: 'settings' as const, label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all border-b-2 -mb-px',
                activeTab === tab.id 
                  ? 'border-foreground text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {activeTab === 'dice' && (
            <div className="space-y-6">
              {/* Dice Roller */}
              <DiceRoller />
              
              {/* Coin Flip */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Coins className="w-4 h-4" /> Coin Flip
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={flipCoin}
                    disabled={coinFlipping}
                    className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    Flip Coin
                  </button>
                  {coinResult && (
                    <div className={cn(
                      'px-4 py-2 rounded-xl font-display text-xl capitalize',
                      coinFlipping ? 'bg-secondary animate-pulse' : 'bg-secondary'
                    )}>
                      {coinResult}
                    </div>
                  )}
                </div>
              </div>

              {/* High Roll */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> High Roll (Starting Player)
                </h3>
                <button
                  onClick={highRoll}
                  disabled={isRollingHigh}
                  className="px-6 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 w-full"
                >
                  {isRollingHigh ? 'Rolling...' : 'Roll for Starting Player'}
                </button>
                {highRollResults.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {highRollResults.map(result => {
                      const player = room.players.find(p => p.id === result.playerId);
                      const isWinner = highRollWinner === result.playerId;
                      return (
                        <div 
                          key={result.playerId}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-lg transition-all',
                            isWinner ? 'bg-accent/20 ring-2 ring-accent' : 'bg-secondary/50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: `hsl(${player?.color})` }}
                            />
                            <span className={cn(isWinner && 'font-semibold')}>{player?.name}</span>
                          </div>
                          <span className={cn(
                            'font-display text-xl',
                            isWinner && 'text-accent'
                          )}>
                            {result.roll}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Game Timer */}
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                  <Timer className="w-3 h-3" /> Game Time
                </div>
                <div className="font-display text-5xl tabular-nums tracking-tight">
                  {formatTime(displayTime)}
                </div>
              </div>

              {/* Timer Controls */}
              {isAdmin && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={onToggleGameTimer}
                    className={cn(
                      'p-3 rounded-2xl transition-all',
                      room.gameTimer.running 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    )}
                  >
                    {room.gameTimer.running ? (
                      <PauseCircle className="w-6 h-6" />
                    ) : (
                      <PlayCircle className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={onResetGameTimer}
                    className="p-3 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* Turn Tracker */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Turn</div>
                    <div className="font-display text-xl">Turn {room.turnNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Active</div>
                    <div className="flex items-center gap-2 justify-end">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: `hsl(${activePlayer?.color})` }}
                      />
                      <span className="font-medium text-sm">{activePlayer?.name}</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <>
                    {/* Turn Navigation */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={onPreviousTurn}
                        className="flex-1 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        <SkipBack className="w-4 h-4" />
                        Prev
                      </button>
                      <button
                        onClick={onNextTurn}
                        className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        Next
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Player Quick Select */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {room.players.map((player, index) => (
                        <button
                          key={player.id}
                          onClick={() => onSetActivePlayer(index)}
                          className={cn(
                            'px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all text-xs',
                            room.activePlayerIndex === index
                              ? 'ring-2 ring-foreground bg-foreground/10'
                              : 'bg-secondary hover:bg-secondary/80'
                          )}
                        >
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `hsl(${player.color})` }}
                          />
                          <span className="truncate">{player.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Game Actions - Admin Only */}
              {isAdmin && (
                <div className="pt-4 border-t border-border space-y-4">
                  {/* Player Count */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                      <Users className="w-3 h-3" /> Players
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {([2, 3, 4, 5, 6] as PlayerCount[]).map(count => (
                        <button
                          key={count}
                          onClick={() => onSetPlayerCount(count)}
                          className={cn(
                            'py-2.5 rounded-xl font-display text-lg transition-all',
                            room.playerCount === count
                              ? 'bg-foreground text-background'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Game */}
                  <button
                    onClick={() => {
                      if (confirm('Reset game? This will restore all life totals and clear history.')) {
                        onResetGame();
                        onClose();
                      }
                    }}
                    className="w-full py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Game
                  </button>
                </div>
              )}

              {!isAdmin && (
                <div className="pt-4 border-t border-border">
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Only the room admin can change game settings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Wrapper to avoid HMR issues
export function ToolsDrawer(props: ToolsDrawerProps) {
  if (!props.isOpen) return null;
  return <ToolsDrawerContent {...props} />;
}
