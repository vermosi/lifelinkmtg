import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const CONSENT_KEY = 'lifelink-cookie-consent';

type ConsentState = 'undecided' | 'accepted' | 'rejected';

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState>('undecided');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (raw === 'accepted' || raw === 'rejected') {
        setConsent(raw);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {
      // ignore
    }
    setConsent('accepted');
  };

  const reject = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'rejected');
    } catch {
      // ignore
    }
    setConsent('rejected');
  };

  return { consent, accept, reject };
}

export function CookieConsentBanner() {
  const { consent, accept, reject } = useCookieConsent();
  const [hidden, setHidden] = useState(false);

  if (consent !== 'undecided' || hidden) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[110] border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-foreground">
          <p>
            LifeLink uses local storage for room history and preferences. We only use analytics
            cookies if you accept them.{' '}
            <Link to="/cookies" className="underline hover:text-accent">
              Cookie Policy
            </Link>
            ,{' '}
            <Link to="/privacy" className="underline hover:text-accent">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="default" size="sm" onClick={accept}>
            Accept
          </Button>
          <Button variant="outline" size="sm" onClick={reject}>
            Reject
          </Button>
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="ml-1 rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss cookie banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
