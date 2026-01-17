import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { PlayerCount, LayoutConfig, LAYOUTS, getLayoutsForPlayerCount } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';

interface LayoutPickerProps {
  onSelect: (playerCount: PlayerCount, layoutId: string) => void;
  onClose: () => void;
}

// Mini preview component showing the layout arrangement
function LayoutPreview({ layout, isSelected }: { layout: LayoutConfig; isSelected: boolean }) {
  const { rows, cols, playerCells, hasPartner } = layout;
  const totalCells = rows * cols;
  
  // Create a grid and mark which cells belong to which player
  const grid = useMemo(() => {
    const cellMap: (number | null)[] = Array(totalCells).fill(null);
    const partnerCells: Set<number> = new Set();
    
    playerCells.forEach((cells, playerIndex) => {
      cells.forEach((cellIndex, i) => {
        if (cellIndex < totalCells) {
          cellMap[cellIndex] = playerIndex;
          // For partner layouts, second half of each player's cells are partner
          if (hasPartner && cells.length > 1 && i >= cells.length / 2) {
            partnerCells.add(cellIndex);
          }
        }
      });
    });
    
    return { cellMap, partnerCells };
  }, [totalCells, playerCells, hasPartner]);

  return (
    <div
      className={cn(
        "aspect-[3/4] rounded-lg overflow-hidden transition-all cursor-pointer border-2",
        isSelected 
          ? "border-accent ring-2 ring-accent/50 scale-105" 
          : "border-border/50 hover:border-border hover:scale-102"
      )}
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '2px',
        padding: '2px',
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      {grid.cellMap.map((playerIndex, cellIndex) => {
        const isPartner = grid.partnerCells.has(cellIndex);
        return (
          <div
            key={cellIndex}
            className={cn(
              "rounded-sm transition-colors",
              playerIndex !== null
                ? isPartner
                  ? "bg-muted-foreground/40"
                  : "bg-foreground"
                : "bg-transparent"
            )}
          />
        );
      })}
    </div>
  );
}

export function LayoutPicker({ onSelect, onClose }: LayoutPickerProps) {
  const [selectedCount, setSelectedCount] = useState<PlayerCount>(4);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(() => {
    const layouts = getLayoutsForPlayerCount(4);
    return layouts[0]?.id || '';
  });

  const playerCounts: PlayerCount[] = [2, 3, 4, 5, 6];
  const availableLayouts = useMemo(() => getLayoutsForPlayerCount(selectedCount), [selectedCount]);

  const handleCountChange = (count: PlayerCount) => {
    setSelectedCount(count);
    const layouts = getLayoutsForPlayerCount(count);
    setSelectedLayoutId(layouts[0]?.id || '');
  };

  const handleLayoutSelect = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
  };

  const handleConfirm = () => {
    onSelect(selectedCount, selectedLayoutId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-display text-2xl text-foreground">Choose Layout</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Player count tabs */}
      <div className="flex justify-center gap-2 p-4 border-b border-border">
        {playerCounts.map((count) => (
          <button
            key={count}
            onClick={() => handleCountChange(count)}
            className={cn(
              "w-12 h-12 rounded-xl font-display text-xl transition-all",
              selectedCount === count
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {count}
          </button>
        ))}
      </div>

      {/* Layout grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {availableLayouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => handleLayoutSelect(layout.id)}
              className="focus:outline-none"
              aria-label={layout.name}
              aria-pressed={selectedLayoutId === layout.id}
            >
              <LayoutPreview 
                layout={layout} 
                isSelected={selectedLayoutId === layout.id} 
              />
            </button>
          ))}
        </div>
        
        {/* Partner indicator legend */}
        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-foreground" />
            <span>Main Life</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-muted-foreground/40" />
            <span>Partner Life</span>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleConfirm}
          className="w-full py-4 bg-accent text-accent-foreground rounded-xl font-display text-2xl hover:bg-accent/90 transition-colors"
        >
          NEW GAME
        </button>
      </div>
    </div>
  );
}
