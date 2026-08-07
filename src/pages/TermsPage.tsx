import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — LifeLink</title>
        <meta name="description" content="LifeLink Terms of Service. Read the rules and conditions for using our free Magic: The Gathering life counter and streaming overlay tool." />
        <link rel="canonical" href="https://lifelinkmtg.app/terms" />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl mb-6">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: August 7, 2026</p>

          <section className="space-y-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
            <p>
              These Terms of Service govern your access to and use of LifeLink ("the Service"), a free web-based life counter and streaming overlay tool for Magic: The Gathering and other tabletop games. By using the Service, you agree to these terms.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">1. Free Tool</h2>
            <p>
              LifeLink is provided free of charge. We do not guarantee uptime, availability, or that any particular feature will remain unchanged. Rooms and their data are automatically deleted after 24 hours of inactivity.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">2. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>harass, abuse, or harm others;</li>
              <li>share unlawful, defamatory, or infringing content through room names, player names, or other inputs;</li>
              <li>attempt to gain unauthorized access to rooms, accounts, or backend systems;</li>
              <li>interfere with the operation of the Service for other users;</li>
              <li>use automated tools to scrape, spam, or overload the Service.</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground mt-8">3. Room Data</h2>
            <p>
              Game rooms are public to anyone with the room ID, code, or QR code. The optional admin key grants additional control over a room. Do not share your admin key with anyone you do not trust. We are not responsible for misuse of shared room links or keys.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">4. Intellectual Property</h2>
            <p>
              Magic: The Gathering, Commander, EDH, and related terms are trademarks of Wizards of the Coast. LifeLink is an independent fan tool and is not affiliated with or endorsed by Wizards of the Coast.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">5. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee that life totals, commander damage, or other tracked values will always be accurate or preserved. Always verify game state with your playgroup.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">6. Limitation of Liability</h2>
            <p>
              To the extent permitted by law, LifeLink and its operators are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the Service.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">7. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes means you accept the updated Terms.
            </p>

            <h2 className="text-lg font-semibold text-foreground mt-8">8. Contact</h2>
            <p>
              For questions about these Terms, contact us through the project site or support channel.
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
