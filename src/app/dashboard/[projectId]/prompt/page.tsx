"use client";

import { use, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Copy, Check, Download, RefreshCw } from "lucide-react";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";
import { toast } from "sonner";

interface PromptData {
  id: string;
  markdown: string;
  version: number;
  createdAt: string;
}

export default function PromptViewerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const { copied, copy } = useCopyClipboard();

  useEffect(() => {
    fetch(`/api/projects/${projectId}/prompt`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        setPrompt(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  function downloadMarkdown() {
    if (!prompt) return;
    const blob = new Blob([prompt.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frontend-dna-prompt-v${prompt.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/prompt/regenerate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPrompt(data);
        toast.success(`Regenerated! Version ${data.version}`);
      } else {
        toast.error("Failed to regenerate");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No prompt generated yet. Scraping may still be in progress.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between sticky top-16 z-40 bg-background/80 backdrop-blur-sm py-3 -mx-6 px-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Generated Prompt</h1>
          <span className="text-xs text-muted-foreground">v{prompt.version}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={regenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1">Regenerate</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(prompt.markdown)}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="ml-1">{copied ? "Copied!" : "Copy"}</span>
          </Button>
          <Button size="sm" onClick={downloadMarkdown}>
            <Download className="h-4 w-4 mr-1" /> Download .md
          </Button>
        </div>
      </div>

      {/* Markdown Preview */}
      <Card>
        <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {prompt.markdown}
          </ReactMarkdown>
        </CardContent>
      </Card>
    </div>
  );
}
