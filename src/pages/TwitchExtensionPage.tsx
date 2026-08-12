import { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const SITE_URL = 'https://lifelinkmtg.app';
const ZIP_NAME = 'lifelink-twitch-extension.zip';
const FETCH_DOMAIN = 'qswjlzfcznlnepilmgtp.supabase.co';

const SETUP_STEPS: { title: string; body: string }[] = [
  {
    title: 'Download the extension package',
    body: 'Grab the ZIP below. It contains the panel, video overlay, and broadcaster configuration pages — everything Twitch needs.',
  },
  {
    title: 'Create the extension on Twitch',
    body: 'Go to dev.twitch.tv/console/extensions and click Create Extension. Enable the "Panel" and "Video - Component" types.',
  },
  {
    title: 'Set the asset paths',
    body: 'Under Asset Hosting set Panel Viewer Path to panel.html, Video Overlay Path to video_overlay.html, Config Path to config.html, and Panel Height to 400.',
  },
  {
    title: 'Allowlist the LifeLink data domain',
    body: `Under Capabilities, add ${FETCH_DOMAIN} to "Allowlist for URL Fetching Domains". Without this Twitch blocks the life-total requests.`,
  },
  {
    title: 'Upload the ZIP and move to hosted test',
    body: 'On the Files tab, upload the ZIP, create a version, then move it to Hosted Test so it can be installed on your channel.',
  },
  {
    title: 'Activate and connect your room',
    body: 'On your channel, open Manage Extensions, activate LifeLink as a Panel and/or Video Overlay, click Configure, paste your room code, and press Save.',
  },
];

const TwitchExtensionPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async () => {
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch(`/${ZIP_NAME}`);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = ZIP_NAME;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Twitch Extension for MTG Life Totals — LifeLink</title>
        <meta
          name="description"
          content="Render live Magic: The Gathering life totals natively inside Twitch with the LifeLink extension — no OBS Browser Source or iframe required."
        />
        <link rel="canonical" href={`${SITE_URL}/twitch-extension`} />
        <meta property="og:title" content="Twitch Extension for MTG Life Totals — LifeLink" />
        <meta
          property="og:description"
          content="Render live Magic: The Gathering life totals natively inside Twitch with the LifeLink extension."
        />
        <meta property="og:url" content={`${SITE_URL}/twitch-extension`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to LifeLink
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">LifeLink Twitch Extension</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A real Twitch Extension that renders your live life totals inside Twitch itself — as a
          channel panel and as a video overlay. No OBS Browser Source, no iframe embedding. It is
          strictly read-only: viewers can see the game, never change it.
        </p>

        <button
          type="button"
          onClick={download}
          disabled={downloading}
          className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {downloading ? 'Preparing download…' : 'Download extension package (.zip)'}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <h2 className="mt-10 text-lg font-semibold">Setup — about five minutes, once</h2>
        <ol className="mt-4 space-y-4">
          {SETUP_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-xl border border-border bg-card/60 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-lg font-semibold">Good to know</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Totals refresh about every two seconds, with automatic backoff if Twitch throttles.</li>
          <li>
            Hosted Test lets you use it on your own channel immediately. Submitting for Twitch review
            is only needed if you want other streamers to install it.
          </li>
          <li>
            The configuration page validates the room code against the live database before saving, so
            a typo is caught before you go on stream.
          </li>
          <li>
            Prefer no install at all? The{' '}
            <span className="text-foreground">embed widget</span> in your room&apos;s Share tab still
            works in Twitch panels via a plain URL.
          </li>
        </ul>
      </div>
    </>
  );
};

export default TwitchExtensionPage;
