import { useState, type ReactNode } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { submitFeedback } from '@/lib/feedback';
import { markFeedbackSubmitted } from '@/lib/feedbackPrompt';
import { cn } from '@/lib/utils';

interface FeedbackDialogProps {
  /** Where the form was opened from, e.g. `home`, `room`, `post_game`. */
  surface: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function FeedbackDialog({
  surface,
  trigger,
  open,
  onOpenChange,
  className,
}: FeedbackDialogProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const close = () => setOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast({ title: 'Pick thumbs up or down first.' });
      return;
    }
    setIsSending(true);
    const result = await submitFeedback({ rating, message, email, surface });
    setIsSending(false);

    if (!result.ok) {
      toast({ title: 'Not sent', description: result.error });
      return;
    }

    markFeedbackSubmitted();
    setRating(null);
    setMessage('');
    setEmail('');
    toast({ title: 'Thanks — feedback sent.' });
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild className={className}>
          {trigger}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            How is LifeLink working for you? A few words help more than you think.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">Overall</legend>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={rating === 'up' ? 'default' : 'outline'}
                aria-pressed={rating === 'up'}
                onClick={() => setRating('up')}
                className="flex-1 gap-2"
              >
                <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                Good
              </Button>
              <Button
                type="button"
                variant={rating === 'down' ? 'default' : 'outline'}
                aria-pressed={rating === 'down'}
                onClick={() => setRating('down')}
                className="flex-1 gap-2"
              >
                <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                Needs work
              </Button>
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">What could be better? (optional)</Label>
            <Textarea
              id="feedback-message"
              value={message}
              maxLength={1000}
              rows={4}
              placeholder="Anything that confused you, broke, or is missing."
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-email">Email (optional, only if you want a reply)</Label>
            <Input
              id="feedback-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={255}
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={cn('flex justify-end gap-2')}>
            <Button type="button" variant="ghost" onClick={close} disabled={isSending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSending || !rating}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
