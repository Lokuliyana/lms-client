"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMyChallenges, type ChallengeMatch } from "@/services/quizService";

type UseChallengesOpts = {
  userId?: string;
  enabled?: boolean;
  pollMs?: number;
};

export type ChallengeBuckets = {
  all: ChallengeMatch[];
  queuedIncoming: ChallengeMatch[];  // p2 == me (invites TO me)
  queuedOutgoing: ChallengeMatch[];  // p1 == me (invites I sent)
  inProgress: ChallengeMatch[];
  completed: ChallengeMatch[];
  expired: ChallengeMatch[];
  cancelled: ChallengeMatch[];
};

export type ChallengeStats = {
  pendingInvites: number;    // incoming queued
  opponentsInvites: number;  // outgoing queued
  winRatePct: number;        // among decided (ignores ties)
  wins: number;
  losses: number;
  ties: number;
};

export function useChallenges({ userId, enabled = true, pollMs = 20000 }: UseChallengesOpts) {
  const [rows, setRows] = useState<ChallengeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getMyChallenges(); // { count, results }
      setRows(Array.isArray(res?.results) ? res.results : []);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch challenges");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchAll();
    if (pollMs && pollMs > 0) {
      timerRef.current = setInterval(fetchAll, pollMs);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    return () => {};
  }, [fetchAll, pollMs]);

  const buckets: ChallengeBuckets = useMemo(() => {
    const me = userId;
    const byStatus = (s: ChallengeMatch["status"]) => rows.filter(r => r.status === s);

    const queued = byStatus("queued");
    // ✅ precise definitions using p1/p2
    const queuedIncoming = queued.filter(r => me && (typeof (r as any).p2_id === "object" ? (r as any).p2_id?._id === me : r.p2_id === me));
    const queuedOutgoing = queued.filter(r => me && (typeof (r as any).p1_id === "object" ? (r as any).p1_id?._id === me : r.p1_id === me));

    return {
      all: rows,
      queuedIncoming,
      queuedOutgoing,
      inProgress: byStatus("in_progress"),
      completed: byStatus("completed"),
      expired: byStatus("expired"),
      cancelled: byStatus("cancelled"),
    };
  }, [rows, userId]);

  const stats: ChallengeStats = useMemo(() => {
    let wins = 0, losses = 0, ties = 0;
    for (const m of buckets.completed) {
      if (!m.winner) { ties += 1; continue; }
      const me = userId;
      if (me && m.winner === me) wins += 1;
      else losses += 1;
    }
    const decided = wins + losses;
    const winRatePct = decided > 0 ? Math.round((wins / decided) * 100) : 0;

    return {
      pendingInvites: buckets.queuedIncoming.length,
      opponentsInvites: buckets.queuedOutgoing.length,
      winRatePct,
      wins,
      losses,
      ties,
    };
  }, [buckets, userId]);

  return { rows, buckets, stats, loading, error, refetch: fetchAll };
}
