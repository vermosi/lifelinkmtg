import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { ICON_ASSETS, ICON_VERSION, versionedIconUrl } from '@/lib/icon-assets';

type LoadState = 'loading' | 'ok' | 'error';

interface IconResult {
  state: LoadState;
  naturalWidth?: number;
  naturalHeight?: number;
}

const FaviconCheckPage = () => {
  const [nonce, setNonce] = useState(ICON_VERSION);
  const [results, setResults] = useState<Record<string, IconResult>>({});
  const [manifestState, setManifestState] = useState<LoadState>('loading');
  const [manifestIconCount, setManifestIconCount] = useState<number | null>(null);

  const setResult = useCallback((path: string, result: IconResult) => {
    setResults((prev) => ({ ...prev, [path]: result }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setManifestState('loading');
    setManifestIconCount(null);

    fetch(versionedIconUrl('/site.webmanifest', nonce), { cache: 'reload' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const manifest = (await response.json()) as { icons?: unknown[] };
        if (cancelled) return;
        setManifestIconCount(Array.isArray(manifest.icons) ? manifest.icons.length : 0);
        setManifestState('ok');
      })
      .catch(() => {
        if (!cancelled) setManifestState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const hardRefresh = () => {
    setResults({});
    setNonce(`${ICON_VERSION}-${Date.now()}`);
  };

  const badge = (state: LoadState) => {
    const styles: Record<LoadState, string> = {
      loading: 'bg-muted text-muted-foreground',
      ok: 'bg-primary/15 text-primary',
      error: 'bg-destructive/15 text-destructive',
    };
    const text: Record<LoadState, string> = { loading: 'Loading…', ok: 'Loaded', error: 'Failed' };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[state]}`}>{text[state]}</span>
    );
  };

  return (
    <>
      <Helmet>
        <title>Favicon check — LifeLink</title>
        <meta name="description" content="Verify that every LifeLink favicon and app icon loads correctly." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="font-display text-3xl text-foreground">Favicon check</h1>
          <p className="text-sm text-muted-foreground">
            Open this page in each browser you care about (Chrome, Safari, Firefox, Edge) and confirm every
            icon below renders and the tab icon matches. Current icon version:{' '}
            <code className="rounded bg-muted px-1 py-0.5">v={ICON_VERSION}</code>
          </p>
          <Button onClick={hardRefresh} className="min-h-11">
            Force re-fetch icons
          </Button>
        </header>

        <section aria-labelledby="assets-heading" className="space-y-3">
          <h2 id="assets-heading" className="text-lg font-semibold text-foreground">
            Icon assets
          </h2>
          <ul className="space-y-3">
            {ICON_ASSETS.map((asset) => {
              const url = versionedIconUrl(asset.path, nonce);
              const result = results[asset.path] ?? { state: 'loading' as LoadState };
              const sizeMismatch =
                result.state === 'ok' &&
                asset.size !== null &&
                (result.naturalWidth !== asset.size || result.naturalHeight !== asset.size);

              return (
                <li
                  key={asset.path}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
                >
                  <img
                    key={url}
                    src={url}
                    alt={`${asset.label} preview`}
                    width={56}
                    height={56}
                    className="size-14 rounded-md bg-background object-contain"
                    onLoad={(event) =>
                      setResult(asset.path, {
                        state: 'ok',
                        naturalWidth: event.currentTarget.naturalWidth,
                        naturalHeight: event.currentTarget.naturalHeight,
                      })
                    }
                    onError={() => setResult(asset.path, { state: 'error' })}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{asset.label}</span>
                      {badge(result.state)}
                    </div>
                    <p className="text-sm text-muted-foreground">{asset.usage}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.state === 'ok'
                        ? `${result.naturalWidth}×${result.naturalHeight}px`
                        : asset.size
                          ? `expected ${asset.size}×${asset.size}px`
                          : ''}
                      {sizeMismatch ? ' — unexpected dimensions' : ''}
                    </p>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    Open
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="manifest-heading" className="space-y-2">
          <h2 id="manifest-heading" className="text-lg font-semibold text-foreground">
            Web app manifest
          </h2>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
            <span className="font-medium text-foreground">/site.webmanifest</span>
            {badge(manifestState)}
            {manifestIconCount !== null && (
              <span className="text-sm text-muted-foreground">{manifestIconCount} icon entries</span>
            )}
          </div>
        </section>

        <section aria-labelledby="tips-heading" className="space-y-2">
          <h2 id="tips-heading" className="text-lg font-semibold text-foreground">
            If the tab icon still looks old
          </h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Hard reload the page (Ctrl/Cmd + Shift + R).</li>
            <li>Favicons cache separately — open the icon link above directly, then reload the site.</li>
            <li>Safari and iOS home-screen icons refresh only after removing and re-adding the shortcut.</li>
            <li>
              If the icon files changed, bump <code className="rounded bg-muted px-1">ICON_VERSION</code> in{' '}
              <code className="rounded bg-muted px-1">src/lib/icon-assets.ts</code> and the{' '}
              <code className="rounded bg-muted px-1">?v=</code> values in <code className="rounded bg-muted px-1">index.html</code>.
            </li>
          </ol>
        </section>
      </div>
    </>
  );
};

export default FaviconCheckPage;
