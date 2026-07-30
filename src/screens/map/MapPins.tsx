import type { MapLocation, User } from '@/domain/types';
import { MapMarker } from './MapCanvas';
import { FriendAvatar } from '@/components/FriendAvatar';
import { cx } from '@/components/ui';
import { CATEGORY_STYLE, amenityColor } from './markerMeta';
import { positionA11yLabel, type PlannedPosition } from '@/domain/positions';

/**
 * Display-ready now/next for a stage pin (F1 — asked for at Long Beach). Built
 * by MapScreen from domain/stageNow.ts; only stages with timed data get one,
 * so the empty-lineup map renders exactly as before. `likelyDone` switches the
 * register from a hard "Now" claim to the softened one, and `endEst` marks an
 * estimated/assumed finish so the detail card can carry the est. affordance.
 */
export interface StagePinStatus {
  now: { name: string; likelyDone: boolean; endLabel: string | null; endEst: boolean } | null;
  next: { name: string; timeLabel: string } | null;
}

/** Stage/location pin: colored teardrop with an optional short label. */
export function LocationPin({
  loc,
  labeled,
  labelBelow,
  highlighted,
  status,
  onClick,
}: {
  loc: MapLocation;
  labeled?: boolean;
  /** Alternate near-neighbor stage labels below the dot so adjacent labels
      don't merge into false compound names ("BeatBox Ghost"). */
  labelBelow?: boolean;
  highlighted?: boolean;
  /** Who is on / who is next, when this pin is a stage with timed sets. */
  status?: StagePinStatus;
  onClick?: () => void;
}) {
  const color = loc.category === 'amenity' ? amenityColor(loc.amenityType) : CATEGORY_STYLE[loc.category].color;
  const isStage = loc.category === 'stage';
  const label = labeled && isStage && (
    // The name chip plus at most two whisper-height lines — never a panel.
    // Chips are solid fills with white/ink text (the sunlight rule: state is
    // never carried by a translucent wash over map artwork). Prefixes and
    // times are shrink-0 so truncation eats the band name, not the claim —
    // "…· likely done" losing its qualifier would turn a hedge into a lie.
    <span className="flex flex-col items-center gap-px">
      <span
        className="max-w-[72px] truncate whitespace-nowrap rounded px-1 py-px text-[9px] font-bold text-white shadow"
        style={{ background: color }}
      >
        {loc.shortName ?? loc.name}
      </span>
      {status?.now && (
        <span
          className={cx(
            'flex max-w-[92px] whitespace-nowrap rounded px-1 py-px text-[9px] font-bold shadow',
            status.now.likelyDone ? 'bg-[#475569] text-white' : 'bg-warp-pink text-white',
          )}
        >
          {status.now.likelyDone ? (
            <>
              <span className="min-w-0 truncate">{status.now.name}</span>
              <span className="shrink-0">&nbsp;· likely done</span>
            </>
          ) : (
            <>
              <span className="shrink-0">Now:&nbsp;</span>
              <span className="min-w-0 truncate">{status.now.name}</span>
            </>
          )}
        </span>
      )}
      {status?.next && (
        <span className="flex max-w-[92px] whitespace-nowrap rounded bg-white/95 px-1 py-px text-[9px] font-bold text-warp-ink shadow">
          <span className="shrink-0">Next:&nbsp;</span>
          <span className="min-w-0 truncate">{status.next.name}</span>
          <span className="shrink-0">&nbsp;· {status.next.timeLabel}</span>
        </span>
      )}
    </span>
  );
  // The pin answers out loud too — a screen reader gets the same now/next the
  // sighted eye does, with the same softened register.
  const ariaLabel = [
    `${loc.name}${loc.amenityType ? ` (${loc.amenityType})` : ''}`,
    ...(status?.now
      ? [status.now.likelyDone ? `${status.now.name} likely done` : `now: ${status.now.name}`]
      : []),
    ...(status?.next ? [`next: ${status.next.name} at ${status.next.timeLabel}`] : []),
  ].join(' — ');
  return (
    <MapMarker
      xPercent={loc.xPercent}
      yPercent={loc.yPercent}
      onClick={onClick}
      ariaLabel={ariaLabel}
      z={isStage ? 3 : 2}
    >
      <div className="flex flex-col items-center gap-0.5">
        {!labelBelow && label}
        <span
          className="flex items-center justify-center rounded-full border-2 border-white shadow-md"
          style={{
            width: isStage ? 18 : 14,
            height: isStage ? 18 : 14,
            background: color,
            outline: highlighted ? '3px solid #ffd21e' : undefined,
          }}
        >
          {isStage && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        {labelBelow && label}
      </div>
    </MapMarker>
  );
}

/** Two or more friends planned at the same spot: one cluster chip instead of
    stacked pins that hide each other (a hidden pin reads as a lost friend). */
export function FriendClusterPin({
  users,
  loc,
  sourceSummary,
  onClick,
}: {
  users: User[];
  loc: MapLocation;
  /** e.g. "1 checked in, 1 planned" — read out, not implied by dimming. */
  sourceSummary: string;
  onClick?: () => void;
}) {
  return (
    <MapMarker
      xPercent={loc.xPercent}
      yPercent={loc.yPercent}
      onClick={onClick}
      ariaLabel={`${users.map((u) => u.name).join(' and ')} at ${loc.name}: ${sourceSummary}`}
      anchor="bottom"
      z={5}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center rounded-full border-2 border-white bg-white/95 py-0.5 pl-0.5 pr-1.5 shadow-md">
          <span className="flex -space-x-2">
            {users.slice(0, 3).map((u) => (
              <FriendAvatar key={u.id} user={u} size={24} className="ring-2 ring-white" />
            ))}
          </span>
          <span className="ml-1 text-[10px] font-bold text-warp-ink">{users.length}</span>
        </div>
        <span className="-mt-0.5 rounded-full bg-[#1f5fa8] px-1 text-[8px] font-bold leading-[13px] text-white shadow">
          {sourceSummary}
        </span>
        <span
          className="h-0 w-0"
          style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #fff' }}
          aria-hidden
        />
      </div>
    </MapMarker>
  );
}

/**
 * Friend marker. The position SOURCE is carried by a visible badge, never by
 * opacity alone — a faded pin in sunlight is indistinguishable from a normal
 * one, and "planned" vs "checked in 6m ago" changes whether you walk over
 * (plan §P0-3).
 */
export function FriendPin({
  user,
  position,
  loc,
  onClick,
}: {
  user: User;
  position: PlannedPosition;
  loc?: MapLocation;
  onClick?: () => void;
}) {
  // A check-in on bare map has coordinates but no location — draw it there
  // rather than dropping the marker.
  const at = loc
    ? { xPercent: loc.xPercent, yPercent: loc.yPercent }
    : position.coordinates;
  if (!at) return null;
  const traveling = position.kind === 'traveling';
  const manual = position.source === 'manual';
  const hasStaleHistory = !!position.staleCheckIn;

  const badge = manual
    ? { text: `${position.ageMinutes ?? 0}m`, bg: '#0a7d5a' }
    : traveling
      ? { text: 'Walking', bg: '#b45309' }
      : hasStaleHistory
        ? { text: 'Planned', bg: '#475569' }
        : { text: 'Planned', bg: '#1f5fa8' };

  return (
    <MapMarker
      xPercent={at.xPercent}
      yPercent={at.yPercent}
      onClick={onClick}
      ariaLabel={positionA11yLabel(position, user.name)}
      anchor="bottom"
      z={5}
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <FriendAvatar user={user} size={30} ring />
          {manual && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-warp-ok"
              aria-hidden
            />
          )}
          {traveling && (
            <span className="absolute -right-1 -top-1 rounded-full bg-warp-yellow px-1 text-[8px] font-bold text-warp-ink shadow">
              →
            </span>
          )}
        </div>
        <span
          className="-mt-0.5 rounded-full px-1 text-[8px] font-bold leading-[13px] text-white shadow"
          style={{ background: badge.bg }}
        >
          {badge.text}
        </span>
        {hasStaleHistory && (
          <span className="rounded-full bg-[#475569] px-1 text-[7px] font-bold leading-[11px] text-white/90 shadow">
            stale {position.staleCheckIn!.ageMinutes}m
          </span>
        )}
        <span
          className="h-0 w-0"
          style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #fff' }}
          aria-hidden
        />
      </div>
    </MapMarker>
  );
}
