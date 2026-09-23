/**
 * Frequency-capped signal for the post-game feedback prompt.
 *
 * A game ending publishes an event; the prompt only reacts if the player has
 * not been asked (or has not answered) recently.
 */
const LAST_PROMPT_KEY = 'lifelink-feedback-last-prompt';
const DONE_KEY = 'lifelink-feedback-submitted';
const PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type Listener = () => void;

const listeners = new Set<Listener>();

function readNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function write(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // storage unavailable — the prompt simply shows again next time
  }
}

/** True when enough time has passed and the player has not already sent feedback. */
export function canPromptForFeedback(): boolean {
  if (readNumber(DONE_KEY) > 0) return false;
  return Date.now() - readNumber(LAST_PROMPT_KEY) > PROMPT_COOLDOWN_MS;
}

export function markPromptShown(): void {
  write(LAST_PROMPT_KEY, Date.now());
}

export function markFeedbackSubmitted(): void {
  write(DONE_KEY, Date.now());
}

/** Called when a game finishes (reset). */
export function notifyGameEnded(): void {
  listeners.forEach((listener) => listener());
}

export function onGameEnded(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
