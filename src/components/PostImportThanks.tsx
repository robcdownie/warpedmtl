import { Heart } from 'lucide-react';
import { useApp } from '@/store/appStore';
import { BASE_URL, FR_POST_IMPORT_THANKS } from '@/config/event';

/**
 * One-time thank-you rendered under a successful SCHEDULE import — the app's
 * peak-delivered-value moment (donation memo): someone just received the whole
 * set-times board from another fan, free, offline.
 *
 * Rules it lives by, in order: it never gates or delays the import result (a
 * sibling below it, never a modal, never a step); selections imports — the
 * crew loop, other people's goodwill — never show it; one link, one dismiss
 * that never returns, through the same dismissedTips plumbing as every other
 * one-time surface. If launch-week sentiment sours, dropping the render in
 * ImportPanel is the whole revert.
 */
export function PostImportThanks() {
  const dismissed = useApp((s) => s.settings.dismissedTips);
  const dismissTip = useApp((s) => s.dismissTip);
  if (dismissed.includes('post-import-thanks')) return null;

  return (
    <div
      role="note"
      className="surface-card mt-3 rounded-2xl border border-warp-pink/40 bg-warp-pink/5 p-4 shadow-sm"
    >
      <p className="text-[13px] leading-relaxed text-primary">
        Set times imported — you just got the whole board from another fan, free, no signal
        needed. That&apos;s the whole app. If it earns its keep this weekend, there&apos;s a tip
        jar in About. Either way: have a great show.
      </p>
      <p
        lang="fr"
        className="mt-2 border-t border-warp-pink/20 pt-2 text-[12px] leading-relaxed text-secondary"
      >
        {FR_POST_IMPORT_THANKS}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <a
          href={`${BASE_URL}donate.html`}
          target="_blank"
          rel="noreferrer noopener"
          className="flex min-h-touch flex-1 items-center justify-center gap-1.5 rounded-lg border border-warp-pink/50 bg-warp-pink/10 px-4 font-display text-[14px] text-primary active:bg-warp-pink/20"
        >
          <Heart size={15} aria-hidden /> Chip in
        </a>
        <button
          type="button"
          onClick={() => void dismissTip('post-import-thanks')}
          className="min-h-touch shrink-0 rounded-lg px-3 text-[13px] font-bold text-secondary active:bg-[var(--press)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
