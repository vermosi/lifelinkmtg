import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Check, Copy, HelpCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface HelpDialogProps {
  /** When provided, the overlay link for this room can be copied straight from Help. */
  overlayUrl?: string;
  variant?: 'button' | 'link';
  className?: string;
}

/**
 * Compact, progressive-disclosure help. Never renders an admin key — the
 * overlay link is read-only by design.
 */
export function HelpDialog({ overlayUrl, variant = 'button', className }: HelpDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyOverlay = async () => {
    if (!overlayUrl) return;
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the URL is still visible in the Share tab.
    }
  };

  return (
    <Dialog onOpenChange={(open) => open && trackEvent('help_opened')}>
      <DialogTrigger asChild>
        {variant === 'link' ? (
          <button
            type="button"
            className={className ?? 'text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline min-h-[44px] px-2'}
          >
            Help &amp; setup
          </button>
        ) : (
          <Button variant="outline" size="sm" className={className}>
            <HelpCircle className="mr-1.5 h-4 w-4" aria-hidden />
            Help
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help &amp; setup</DialogTitle>
        </DialogHeader>

        <Accordion type="single" collapsible defaultValue="start" className="w-full">
          <AccordionItem value="start">
            <AccordionTrigger className="text-left text-sm">Start or join a game</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-4">
                <li>Tap <strong>New game</strong>, pick how many players are at the table, and you're in.</li>
                <li>Everyone else joins by scanning the QR code or typing the short room code on the home page.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="links">
            <AccordionTrigger className="text-left text-sm">Which link do I share?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-4">
                <li><strong>Control link:</strong> keep it private. Anyone with it can change the game.</li>
                <li><strong>Overlay link:</strong> safe to share and to put on stream — it can only be viewed.</li>
              </ul>
              {overlayUrl && (
                <Button variant="secondary" size="sm" className="mt-3" onClick={copyOverlay}>
                  {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy overlay link'}
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="play">
            <AccordionTrigger className="text-left text-sm">Changing life, undo and reset</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-4">
                <li>Tap the top half of a player's area to add life, the bottom half to subtract.</li>
                <li>Hold to change quickly; tap the number to type an exact total.</li>
                <li><strong>Undo</strong> reverses the last life change. <strong>Reset game</strong> puts everyone back to the starting total.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="obs">
            <AccordionTrigger className="text-left text-sm">Put it on stream (OBS)</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ol className="list-decimal space-y-1 pl-4">
                <li>In OBS add a <strong>Browser</strong> source.</li>
                <li>Paste the overlay link.</li>
                <li>Set width <strong>1920</strong> and height <strong>1080</strong>.</li>
                <li>Tick "Shutdown source when not visible" and "Refresh browser when scene becomes active".</li>
              </ol>
              <p className="mt-2">The overlay background stays transparent, so it sits on top of your gameplay.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="stale">
            <AccordionTrigger className="text-left text-sm">Overlay looks stuck or out of date</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-4">
                <li>Right-click the browser source in OBS and choose <strong>Refresh</strong>.</li>
                <li>Check the overlay link still has the right room code.</li>
                <li>If it's blank, open the same link in a normal browser tab to confirm the room exists.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="offline">
            <AccordionTrigger className="text-left text-sm">Offline or "changes not synced"</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-4">
                <li>Keep playing — your totals stay on this device and are saved.</li>
                <li>When the connection returns, changes upload automatically; you can also tap <strong>Retry</strong>.</li>
                <li>Don't refresh while it says changes aren't synced.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
