import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — LifeLink</title>
        <meta name="description" content="LifeLink Privacy Policy. Learn what data we collect, how we use it, and your rights when using our free MTG life counter." />
        <link rel="canonical" href="https://lifelinkmtg.app/privacy" />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl mb-6">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: August 7, 2026</p>

          <section className="space-y-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
            <p>
              This Privacy Policy explains how LifeLink ("we", "us") handles information when you use our free life counter and streaming overlay service.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">1. Information We Collect</h2>
            <p>
              We collect only the information needed to operate the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Room data:</strong> player names, life totals, commander damage, counters, and other values you enter into a room.
              </li>
              <li>
                <strong>Technical data:</strong> browser type, approximate location, and usage analytics to help us understand and improve the Service.
              </li>
              <li>
                <strong>Authentication data (optional):</strong> if you sign in through a social provider, we receive the identifiers required to maintain your session.
              </li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground mt-8">2. How We Use Information</h2>
            <p>
              We use collected information to provide, maintain, and improve the Service, to fix bugs, and to understand how players use LifeLink. We do not sell personal information.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">3. Data Retention</h2>
            <p>
              Game rooms are automatically deleted 24 hours after the last update. Analytics and log data may be kept longer for operational purposes.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">4. Sharing Information</h2>
            <p>
              We do not share room data with third parties except as required to operate the Service (for example, cloud hosting and analytics providers). Room data is visible to anyone you share the room link or code with.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">5. Cookies and Storage</h2>
            <p>
              The Service uses local browser storage and similar technologies to remember recent rooms and preferences. Third-party analytics may use cookies. See our <Link to="/cookies" className="text-accent hover:underline">Cookie Policy</Link> for details.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">6. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, or delete your personal information. Because room data is temporary, the easiest way to remove it is to stop using the room and let it expire after 24 hours.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">7. Children's Privacy</h2>
            <p>
              The Service is not directed at children under 13. We do not knowingly collect personal information from children.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy. Changes will be posted on this page with an updated date.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">9. Contact</h2>
            <p>
              For privacy questions, contact us through the project site or support channel.
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
