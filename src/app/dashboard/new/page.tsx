"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [urls, setUrls] = useState([""]);
  const [submitting, setSubmitting] = useState(false);

  function addUrl() {
    if (urls.length >= 10) return;
    setUrls([...urls, ""]);
  }

  function removeUrl(index: number) {
    if (urls.length <= 1) return;
    setUrls(urls.filter((_, i) => i !== index));
  }

  function updateUrl(index: number, value: string) {
    const updated = [...urls];
    updated[index] = value;
    setUrls(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validUrls = urls.filter((u) => u.trim());
    if (!name.trim() || validUrls.length === 0) {
      toast.error("Please provide a project name and at least one URL.");
      return;
    }

    // Basic URL validation
    for (const url of validUrls) {
      try {
        new URL(url);
      } catch {
        toast.error(`Invalid URL: ${url}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), urls: validUrls }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create project");
        return;
      }

      const data = await res.json();
      toast.success("Project created! Scraping started...");
      router.push(`/dashboard/${data.project.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Project</h1>

      <Card>
        <CardHeader>
          <CardTitle>Extract Design System</CardTitle>
          <CardDescription>
            Add the URLs you want to scrape. Each page will be loaded in a headless
            browser to extract computed styles, CSS variables, typography, colors, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., Stripe Homepage Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* URLs */}
            <div className="space-y-3">
              <Label>URLs to Scrape</Label>
              {urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      type="url"
                    />
                  </div>
                  {urls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrl(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {urls.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUrl}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Another URL
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Up to 10 URLs per project. Each URL is scraped independently, then
                tokens are merged.
              </p>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Project & Start Scraping"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
