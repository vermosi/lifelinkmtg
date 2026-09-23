import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const feedbackSchema = z.object({
  rating: z.enum(['up', 'down'], { required_error: 'Pick thumbs up or down.' }),
  message: z.string().trim().max(1000, { message: 'Keep it under 1000 characters.' }).default(''),
  email: z
    .string()
    .trim()
    .max(255, { message: 'Email must be less than 255 characters.' })
    .email({ message: 'That email does not look right.' })
    .optional()
    .or(z.literal('')),
  surface: z
    .string()
    .regex(/^[a-z_]{1,40}$/)
    .default('unknown'),
});

export type FeedbackInput = z.input<typeof feedbackSchema>;

export type FeedbackResult = { ok: true } | { ok: false; error: string };

/** Store one piece of feedback through the validating database function. */
export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const { rating, message, email, surface } = parsed.data;
  const { error } = await supabase.rpc('submit_feedback', {
    p_rating: rating,
    p_message: message ?? '',
    p_email: email ? email : null,
    p_surface: surface,
  });

  if (error) {
    return { ok: false, error: 'Could not send your feedback. Please try again.' };
  }
  return { ok: true };
}
