import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function CookiesPage() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy — LifeLink</title>
        <meta name="description" content="LifeLink Cookie Policy. Learn how we use cookies, local storage, and analytics on our free MTG life counter." />
        <link rel="canonical" href="https://lifelinkmtg.app/cookies" />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl mb-6">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: August 7, 2026</p>

          <section className="space-y-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
            <p>
              This Cookie Policy explains how LifeLink uses cookies and similar technologies.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">1. What We Use</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Essential local storage:</strong> we store recent room IDs and optional preferences in your browser so the Service works smoothly.
              </li>
              <li>
                <strong>Analytics cookies:</strong> we may use analytics providers to understand usage and improve the Service.
              </li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground mt-8">2. Managing Cookies</h2>
            <p>
              You can clear local storage and cookies through your browser settings. If you block essential storage, some features may not work correctly.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">3. Changes</h2>
            <p>
              We may update this Cookie Policy. Changes will be posted on this page with an updated date.
            </p>
          </section>

          <div className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground">
            <Link to="/" className="text-accent hover:underline">← Back to LifeLink</Link>
          </div>
        </div>
      </div>
    </>
  );
}
