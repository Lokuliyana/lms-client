export const DASHBOARD_TZ = "Asia/Colombo";

export function minutesFromHHMM(hhmm?: string) {
  if (!hhmm) return NaN;
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
}

export function isCrossingMidnight(start: string, end: string) {
  const s = minutesFromHHMM(start);
  const e = minutesFromHHMM(end);
  return Number.isFinite(s) && Number.isFinite(e) ? e <= s : false;
}

export function weekdayLowerInTZ(d: Date, tz = DASHBOARD_TZ) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" })
    .format(d)
    .toLowerCase();
}

export function ymdInTZ(d: Date, tz = DASHBOARD_TZ) {
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
  }).format(d);
  const m = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "2-digit",
  }).format(d);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz, day: "numeric" })
    .format(d)
    .padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getNextSessionStartISO(slots: any[], tz = DASHBOARD_TZ) {
  if (!Array.isArray(slots) || !slots.length) return null;
  const now = new Date();
  let best: string | null = null;
  for (let offset = 0; offset < 42; offset += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    const wk = weekdayLowerInTZ(day, tz);
    for (const s of slots) {
      if (!s?.day || !s?.start || !s?.end) continue;
      if (wk !== String(s.day).toLowerCase()) continue;
      
      const iso = `${ymdInTZ(day, tz)}T${s.start}:00`;
      if (new Date(iso) > now) {
        if (!best || iso < best) {
          best = iso;
        }
      }
    }
  }
  return best;
}
