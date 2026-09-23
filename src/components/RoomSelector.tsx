import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Cloud,
  Loader2,
  Grid3X3,
  Monitor,
  Users,
  RefreshCw,
  Smartphone,
  Zap,
  Moon,
  Sun,
  Palette,
  Keyboard,
  History,
  Save,
  Twitch,
  QrCode,
  ShieldCheck,
  Crown,
  Target,
  Skull,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Room, PlayerCount } from '@/lib/roomUtils';
import {
  createCloudRoom,
  getCloudRoom,
  getRecentCloudRooms,
  getStoredAdminKey,
  deleteCloudRoom,
  removeFromRecentRooms,
} from '@/lib/cloudRoomUtils';
import { LayoutPicker } from './LayoutPicker';
import { HelpDialog } from './HelpDialog';
import { FeedbackDialog } from './FeedbackDialog';
import { trackEvent } from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group p-4 sm:p-5 rounded-2xl bg-card/40 border border-border/50 hover:bg-card/70 hover:border-border transition-all">
      <div className="w-10 h-10 bg-card shadow-sm rounded-xl flex items-center justify-center text-accent mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

interface StepProps {
  number: string;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <li className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 text-accent font-display font-bold text-lg flex items-center justify-center">
        {number}
      </div>
      <div>
        <h3 className="font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </li>
  );
}

interface FaqItemProps {
  question: string;
  answer: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <details className="group rounded-2xl bg-card/40 border border-border/50 open:bg-card/70 open:border-border transition-all">
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
        <span className="font-semibold text-foreground text-sm sm:text-base pr-4">{question}</span>
        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 group-open:rotate-180 transition-transform" aria-hidden="true" />
      </summary>
      <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</div>
    </details>
  );
}

export function RoomSelector() {
  const navigate = useNavigate();
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;
    if (!/^[A-Za-z0-9]{4,32}$/.test(code)) {
      toast({ title: 'Invalid code', description: 'Codes are 4-32 letters and numbers.' });
      return;
    }
    setIsJoining(true);
    const room = await getCloudRoom(code);
    setIsJoining(false);
    if (!room) {
      toast({ title: 'Room not found', description: `No active room matches "${code}".` });
      return;
    }
    const storedAdminKey = getStoredAdminKey(room.id);
    if (storedAdminKey) {
      navigate(`/room/${room.id}?adminKey=${storedAdminKey}`);
    } else {
      navigate(`/room/${room.id}`);
    }
  };

  useEffect(() => {
    const loadRecentRooms = async () => {
      setIsLoading(true);
      const rooms = await getRecentCloudRooms();
      setRecentRooms(rooms);
      setIsLoading(false);
    };
    loadRecentRooms();
  }, []);

  const handleCreateRoom = async (playerCount: PlayerCount, layoutId: string) => {
    setIsCreating(true);
    setShowLayoutPicker(false);
    const room = await createCloudRoom(playerCount, layoutId);
    if (room) {
      trackEvent('room_created', { player_count: playerCount });
      navigate(`/room/${room.id}?adminKey=${room.adminKey}`);
    }
    setIsCreating(false);
  };

  const handleOpenRoom = (roomId: string, adminKey: string) => {
    navigate(`/room/${roomId}?adminKey=${adminKey}`);
  };

  const handleDeleteRoom = async (roomId: string, adminKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this room?')) {
      const success = await deleteCloudRoom(roomId, adminKey);
      if (success) {
        removeFromRecentRooms(roomId);
        setRecentRooms((prev) => prev.filter((r) => r.id !== roomId));
      }
    }
  };

  if (showLayoutPicker) {
    return <LayoutPicker onSelect={handleCreateRoom} onClose={() => setShowLayoutPicker(false)} />;
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center p-4 sm:p-8 lg:p-12">
      {/* Soft ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl flex flex-col items-center py-6 sm:py-10">
        {/* Hero */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide uppercase mb-4">
            <Cloud className="w-3 h-3" />
            Cloud Synced Counter & OBS Overlay
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-foreground tracking-tight mb-4">
            LifeLink
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
            Track. Play. Win.
          </p>
        </div>

        {/* Main actions — glass panel */}
        <div className="w-full max-w-2xl bg-card/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-8 mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
            <button
              onClick={() => setShowLayoutPicker(true)}
              disabled={isCreating}
              className="flex-1 py-2.5 sm:py-4 px-4 sm:px-5 bg-accent text-accent-foreground rounded-2xl font-display text-base sm:text-lg lg:text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              {isCreating ? 'CREATING...' : 'NEW GAME'}
            </button>

            <form onSubmit={handleJoinByCode} className="flex-1 relative group">
              <label htmlFor="join-code" className="sr-only">
                Join with code
              </label>
              <input
                id="join-code"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={32}
                placeholder="Join with code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\s+/g, ''))}
                aria-label="Room join code"
                className="w-full h-full py-2.5 sm:py-3 px-4 sm:px-5 pr-[4.5rem] bg-secondary/50 border-2 border-transparent focus:border-accent focus:bg-secondary rounded-2xl outline-none transition-all text-foreground font-display text-sm sm:text-base lg:text-lg tracking-wider text-center placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-body"
              />
              <button
                type="submit"
                disabled={isJoining || joinCode.trim().length < 4}
                className="absolute right-2 top-2 bottom-2 px-3 sm:px-4 bg-card text-accent font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-secondary active:scale-95 transition-all disabled:opacity-50 text-sm"
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'JOIN'}
              </button>
            </form>
          </div>

          <div className="mt-3 sm:mt-4 flex flex-col items-center gap-1">
            <p className="text-center text-xs text-muted-foreground">
              2-6 players · Partner commanders · Multiple layouts
            </p>
            <p className="text-center text-xs text-muted-foreground">
              New here? Start a game, then share the code or QR with your table.
            </p>
            <HelpDialog variant="link" className="text-xs text-accent underline-offset-4 hover:underline min-h-[44px] px-2" />
          </div>
        </div>

        {/* Recent rooms */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          recentRooms.length > 0 && (
            <div className="w-full max-w-2xl mb-6 sm:mb-10">
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Cloud className="w-3 h-3" />
                Recent Games
              </h2>
              <div className="space-y-2">
                {recentRooms.slice(0, 5).map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleOpenRoom(room.id, room.adminKey)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 bg-secondary/60 rounded-xl hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="font-display text-xl sm:text-2xl text-foreground">{room.id}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {room.playerCount}P · {room.settings.startingLife}
                        {room.settings.enablePartnerTracking && ' · Partner'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteRoom(room.id, room.adminKey, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-xs sm:text-sm px-2 py-1"
                    >
                      Delete
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )
        )}


        {/* Full feature grid */}
        <section aria-labelledby="features-heading" className="w-full mb-10 sm:mb-14">
          <h2 id="features-heading" className="text-center font-display text-2xl sm:text-3xl text-foreground mb-2">
            Built for Commander & OTHER MAGIC THE GATHERING FORMATS
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            Everything you need for multiplayer play
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <FeatureCard
              icon={<Users className="w-5 h-5" aria-hidden="true" />}
              title="2–6 players"
              description="Supports any pod size from casual duels to full Commander tables."
            />
            <FeatureCard
              icon={<Target className="w-5 h-5" aria-hidden="true" />}
              title="Commander damage"
              description="Log commander damage per player so 21-damage knockouts are clear."
            />
            <FeatureCard
              icon={<Skull className="w-5 h-5" aria-hidden="true" />}
              title="Poison & energy"
              description="Toggle poison, energy, experience, Monarch, and Initiative counters."
            />
            <FeatureCard
              icon={<Monitor className="w-5 h-5" aria-hidden="true" />}
              title="OBS overlay"
              description="Read-only overlay URL with preset layouts, colors, and safe-area settings."
            />
            <FeatureCard
              icon={<Twitch className="w-5 h-5" aria-hidden="true" />}
              title="Twitch extension"
              description="Native Twitch extension with panel, video overlay, and broadcaster config."
            />
            <FeatureCard
              icon={<Smartphone className="w-5 h-5" aria-hidden="true" />}
              title="Mobile-first"
              description="Big tap targets, no install required, and optimized for phones at the table."
            />
          </div>
        </section>

        {/* Streaming section */}
        <section aria-labelledby="stream-heading" className="w-full max-w-3xl mb-10 sm:mb-14">
          <h2 id="stream-heading" className="text-center font-display text-2xl sm:text-3xl text-foreground mb-2">
            Stream-ready out of the box
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6 sm:mb-8">
            Three ways to show life totals to viewers — no OBS required if you do not want it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-card/40 border border-border/50 text-center">
              <Monitor className="w-6 h-6 text-accent mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-bold text-foreground mb-1">OBS Browser Source</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Read-only overlay URL with preset layouts, colors, and safe-area settings.
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-card/40 border border-border/50 text-center">
              <Twitch className="w-6 h-6 text-accent mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-bold text-foreground mb-1">Twitch Extension</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Native Twitch extension with panel, video overlay, and broadcaster config.
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-card/40 border border-border/50 text-center">
              <QrCode className="w-6 h-6 text-accent mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-bold text-foreground mb-1">Embed Widget</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Drop an iframe on any page with theme and auto-resize support.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-it-works-heading" className="w-full max-w-2xl mb-10 sm:mb-14">
          <h2 id="how-it-works-heading" className="text-center font-display text-2xl sm:text-3xl text-foreground mb-6 sm:mb-8">
            How it works
          </h2>
          <ol className="space-y-6">
            <Step
              number="1"
              title="Create a room"
              description="Tap NEW GAME, pick your player count and table layout, and your shared room is ready."
            />
            <Step
              number="2"
              title="Share the code or QR"
              description="Friends join from any phone or browser with the short room code or a quick scan."
            />
            <Step
              number="3"
              title="Track & stream"
              description="Update life totals together, then copy the overlay URL for OBS or Twitch."
            />
          </ol>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="w-full max-w-2xl mb-10 sm:mb-14">
          <h2 id="faq-heading" className="text-center font-display text-2xl sm:text-3xl text-foreground mb-6 sm:mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            <FaqItem
              question="What is LifeLink?"
              answer="LifeLink is a free, cloud-synced life counter for Magic: The Gathering. It lets 2–6 players share a room from any device and stream life totals through OBS or Twitch."
            />
            <FaqItem
              question="Does it support Commander / EDH?"
              answer="Yes. LifeLink supports commander damage, partner commanders, poison, energy, experience, Monarch, Initiative, and a day/night tracker for Commander games."
            />
            <FaqItem
              question="How do players join the same room?"
              answer="Each room gets a short code and a QR code. Anyone can enter the code on the home page or scan the QR from the room's share screen."
            />
            <FaqItem
              question="Can I use it with OBS or Twitch?"
              answer="Yes. Every room has a read-only overlay URL for OBS Browser Source, a native Twitch extension, and an embeddable widget for other sites."
            />
            <FaqItem
              question="Is LifeLink free?"
              answer="Yes. LifeLink is free to use for tracking life totals and streaming overlays."
            />
            <FaqItem
              question="What devices does it work on?"
              answer="LifeLink runs in any modern web browser on iOS, Android, Windows, macOS, and Linux. No app install is required."
            />
          </div>
        </section>

        <footer className="mt-8 sm:mt-14 pt-6 border-t border-border w-full text-center">
          <nav className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-muted-foreground">
            <HelpDialog variant="link" />
            <span aria-hidden="true">·</span>
            <FeedbackDialog
              surface="home"
              trigger={
                <button type="button" className="hover:text-foreground transition-colors">
                  Send feedback
                </button>
              }
            />
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <span aria-hidden="true">·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span aria-hidden="true">·</span>
            <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <span aria-hidden="true">·</span>
            <a
              href="https://offmeta.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Made by Offmeta
            </a>
          </nav>
          <p className="text-muted-foreground text-xs mt-3">
            Free MTG life counter for 2–6 players.
          </p>
        </footer>
      </div>
    </div>
  );
}
