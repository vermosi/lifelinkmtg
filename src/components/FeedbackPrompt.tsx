import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { canPromptForFeedback, markPromptShown, onGameEnded } from '@/lib/feedbackPrompt';

/**
 * Small dismissible bar shown after a game ends, at most once a month and
 * never again once feedback has been sent.
 */
export function FeedbackPrompt() {
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(
    () =>
      onGameEnded(() => {
        if (!canPromptForFeedback()) return;
        markPromptShown();
        setVisible(true);
      }),
    []
  );

  if (!visible) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Feedback request"
        className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <p className="flex-1 text-sm text-foreground">Good game — how did LifeLink do?</p>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            Give feedback
          </Button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss feedback request"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FeedbackDialog
        surface="post_game"
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setVisible(false);
        }}
      />
    </>
  );
}
