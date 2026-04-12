"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dna,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectStatus {
  total: number;
  completed: number;
  failed: number;
  allDone: boolean;
  hasPrompt: boolean;
  isWebhook: boolean;
}

interface Project {
  id: string;
  name: string;
  urls: string[];
  createdAt: string;
  status: ProjectStatus;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function deleteProject(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Delete this project? This cannot be undone.")) return;

    setDeleting(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        toast.success("Project deleted");
      } else {
        toast.error("Failed to delete project");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading projects...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Dna className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No projects yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first project by pasting a URL to extract its design system.
        </p>
        <Link href="/dashboard/new">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link key={project.id} href={`/dashboard/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full relative group">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate mr-2">{project.name}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardTitle>
                <CardDescription>
                  <div className="flex flex-wrap gap-1.5">
                    {project.urls.map((url, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-mono truncate max-w-[200px]">
                        {new URL(url).hostname}
                      </Badge>
                    ))}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Status indicators */}
                <div className="flex flex-wrap gap-2">
                  <ScrapeStatusBadge status={project.status} />
                  {project.status.hasPrompt && project.status.isWebhook && (
                    <Badge variant="secondary" className="gap-1 text-green-600 border-green-200 bg-green-50">
                      <Send className="h-3 w-3" />
                      Sent to WP
                    </Badge>
                  )}
                  {project.status.hasPrompt && !project.status.isWebhook && (
                    <Badge variant="secondary" className="gap-1 text-green-600 border-green-200 bg-green-50">
                      <CheckCircle2 className="h-3 w-3" />
                      DESIGN.md Ready
                    </Badge>
                  )}
                  {project.status.isWebhook && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      Webhook
                    </Badge>
                  )}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => deleteProject(e, project.id)}
                    disabled={deleting === project.id}
                  >
                    {deleting === project.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ScrapeStatusBadge({ status }: { status: ProjectStatus }) {
  if (!status.allDone) {
    return (
      <Badge variant="default" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Scraping {status.completed}/{status.total}
      </Badge>
    );
  }

  if (status.failed > 0 && status.completed === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  if (status.failed > 0) {
    return (
      <Badge variant="secondary" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
        {status.completed}/{status.total} scraped
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 text-green-600 border-green-200 bg-green-50">
      <CheckCircle2 className="h-3 w-3" />
      {status.total} scraped
    </Badge>
  );
}
