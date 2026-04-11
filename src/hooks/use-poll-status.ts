"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface JobStatus {
  id: string;
  url: string;
  status: "pending" | "running" | "completed" | "failed";
  error: string | null;
  durationMs: number | null;
}

interface StatusSummary {
  total: number;
  completed: number;
  failed: number;
  allDone: boolean;
}

interface PollResult {
  jobs: JobStatus[];
  summary: StatusSummary;
}

export function usePollStatus(projectId: string) {
  const [data, setData] = useState<PollResult | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/status`);
      if (res.ok) {
        const result: PollResult = await res.json();
        setData(result);
        setLoading(false);

        // Stop polling when all done
        if (result.summary.allDone && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      // Silently retry on next interval
    }
  }, [projectId]);

  useEffect(() => {
    // Start polling with setInterval; the first tick fires after 0ms delay
    // to avoid the lint rule about calling setState synchronously in an effect
    intervalRef.current = setInterval(fetchStatus, 2000);

    // Trigger first fetch via setTimeout(0) so it's async from the effect
    const immediate = setTimeout(fetchStatus, 0);

    return () => {
      clearTimeout(immediate);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStatus]);

  return { data, loading };
}
