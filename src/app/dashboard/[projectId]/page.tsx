"use client";

import { use } from "react";
import Link from "next/link";
import { usePollStatus } from "@/hooks/use-poll-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Palette,
  FileText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending", variant: "secondary" as const },
  running: { icon: Loader2, color: "text-blue-500", label: "Running", variant: "default" as const },
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Done", variant: "secondary" as const },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed", variant: "destructive" as const },
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { data, loading } = usePollStatus(projectId);

  async function retryFailed() {
    const res = await fetch(`/api/projects/${projectId}/scrape`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Retrying failed jobs...");
    } else {
      toast.error("Failed to retry");
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { jobs, summary } = data;
  const progressPercent = summary.total > 0
    ? ((summary.completed + summary.failed) / summary.total) * 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Scrape Progress
            {!summary.allDone && (
              <Badge variant="default" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                In Progress
              </Badge>
            )}
            {summary.allDone && summary.failed === 0 && (
              <Badge variant="secondary" className="gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Badge>
            )}
            {summary.allDone && summary.failed > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                {summary.failed} Failed
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {summary.completed} of {summary.total} URLs scraped
            {summary.failed > 0 && ` (${summary.failed} failed)`}
          </p>

          {/* Individual job statuses */}
          <div className="space-y-2">
            {jobs.map((job) => {
              const config = statusConfig[job.status];
              const Icon = config.icon;
              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50 bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${config.color} ${
                        job.status === "running" ? "animate-spin" : ""
                      }`}
                    />
                    <span className="text-sm font-mono truncate">{job.url}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {job.durationMs && (
                      <span className="text-xs text-muted-foreground">
                        {(job.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    <Badge variant={config.variant} className="text-xs">
                      {config.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error details */}
          {jobs.some((j) => j.status === "failed" && j.error) && (
            <div className="space-y-2">
              {jobs
                .filter((j) => j.status === "failed" && j.error)
                .map((j) => (
                  <div key={j.id} className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    <span className="font-mono text-xs">{j.url}:</span> {j.error}
                  </div>
                ))}
            </div>
          )}

          {/* Retry button */}
          {summary.allDone && summary.failed > 0 && (
            <Button variant="outline" size="sm" onClick={retryFailed}>
              <RefreshCw className="h-4 w-4 mr-1" /> Retry Failed
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Actions — shown when scraping is complete */}
      {summary.allDone && summary.completed > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Link href={`/dashboard/${projectId}/tokens`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Explore Tokens</h3>
                  <p className="text-sm text-muted-foreground">
                    View extracted colors, typography, spacing, and more
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/dashboard/${projectId}/prompt`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">View Prompt</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview, copy, or download the generated Markdown
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
