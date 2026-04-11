"use client";

import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check } from "lucide-react";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";

interface TokenData {
  typography: {
    fontFamilies: string[];
    typeScale: Array<{
      element: string;
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      letterSpacing: string;
    }>;
    fontSources: string[];
  };
  colors: {
    palette: Array<{
      hex: string;
      hsl: string;
      usage: string;
      frequency: number;
    }>;
    cssVariableColors: Record<string, string>;
  };
  spacing: {
    scale: number[];
    paddingPatterns: Array<{ value: string; pxValue: number; frequency: number }>;
    gapPatterns: Array<{ value: string; pxValue: number; frequency: number }>;
  };
  shadows: {
    boxShadows: string[];
    textShadows: string[];
  };
  borders: {
    radii: string[];
    widths: string[];
  };
  breakpoints: {
    breakpoints: Array<{ width: number; query: string }>;
  };
  rawCssVariables: Record<string, string>;
}

export default function TokenExplorerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/tokens`)
      .then((res) => res.json())
      .then((data) => {
        setTokens(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tokens) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No tokens found. Scraping may still be in progress.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Design Tokens</h1>

      <Tabs defaultValue="colors">
        <TabsList className="mb-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="shadows">Shadows</TabsTrigger>
          <TabsTrigger value="borders">Borders</TabsTrigger>
          <TabsTrigger value="breakpoints">Breakpoints</TabsTrigger>
          <TabsTrigger value="variables">CSS Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="colors">
          <ColorsTab colors={tokens.colors} />
        </TabsContent>

        <TabsContent value="typography">
          <TypographyTab typography={tokens.typography} />
        </TabsContent>

        <TabsContent value="spacing">
          <SpacingTab spacing={tokens.spacing} />
        </TabsContent>

        <TabsContent value="shadows">
          <ShadowsTab shadows={tokens.shadows} />
        </TabsContent>

        <TabsContent value="borders">
          <BordersTab borders={tokens.borders} />
        </TabsContent>

        <TabsContent value="breakpoints">
          <BreakpointsTab breakpoints={tokens.breakpoints} />
        </TabsContent>

        <TabsContent value="variables">
          <VariablesTab variables={tokens.rawCssVariables} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Color Palette ───────────────────────────────────────────────────────────

function ColorsTab({ colors }: { colors: TokenData["colors"] }) {
  const { copied, copy } = useCopyClipboard();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Palette ({colors.palette.length} colors)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {colors.palette.slice(0, 30).map((c, i) => (
              <button
                key={i}
                onClick={() => copy(c.hex)}
                className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div
                  className="w-full aspect-square rounded-md shadow-sm border border-border/30"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">
                  {c.hex}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {c.usage} ({c.frequency})
                </Badge>
              </button>
            ))}
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
              <Check className="h-3 w-3" /> Copied to clipboard
            </p>
          )}
        </CardContent>
      </Card>

      {Object.keys(colors.cssVariableColors).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CSS Variable Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(colors.cssVariableColors).map(([name, value]) => (
                <div
                  key={name}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg border border-border/50"
                >
                  <div
                    className="w-6 h-6 rounded border border-border/30 flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <span className="text-xs font-mono truncate flex-1">{name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Typography ──────────────────────────────────────────────────────────────

function TypographyTab({ typography }: { typography: TokenData["typography"] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Font Families</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {typography.fontFamilies.map((f, i) => (
              <Badge key={i} variant="secondary" className="font-mono text-xs">
                {f.split(",")[0].trim().replace(/['"]/g, "")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Type Scale ({typography.typeScale.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Element</th>
                  <th className="py-2 pr-4">Font</th>
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Weight</th>
                  <th className="py-2 pr-4">Line Height</th>
                </tr>
              </thead>
              <tbody>
                {typography.typeScale.slice(0, 20).map((t, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-2 pr-4">
                      <Badge variant="secondary" className="text-xs">{t.element}</Badge>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs truncate max-w-[150px]">
                      {t.fontFamily.split(",")[0].trim()}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{t.fontSize}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{t.fontWeight}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{t.lineHeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Spacing ─────────────────────────────────────────────────────────────────

function SpacingTab({ spacing }: { spacing: TokenData["spacing"] }) {
  const maxScale = Math.max(...spacing.scale, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spacing Scale</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {spacing.scale.map((value) => (
            <div key={value} className="flex items-center gap-4">
              <span className="text-xs font-mono w-12 text-right text-muted-foreground">
                {value}px
              </span>
              <div
                className="h-6 bg-primary/20 rounded-sm border border-primary/30"
                style={{ width: `${(value / maxScale) * 100}%`, minWidth: "4px" }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Shadows ─────────────────────────────────────────────────────────────────

function ShadowsTab({ shadows }: { shadows: TokenData["shadows"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Box Shadows ({shadows.boxShadows.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {shadows.boxShadows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No shadows extracted.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {shadows.boxShadows.map((shadow, i) => (
              <div key={i} className="space-y-2">
                <div
                  className="w-full h-24 rounded-lg bg-card border border-border/30"
                  style={{ boxShadow: shadow }}
                />
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {shadow}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Borders ─────────────────────────────────────────────────────────────────

function BordersTab({ borders }: { borders: TokenData["borders"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Border Radii ({borders.radii.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {borders.radii.length === 0 ? (
          <p className="text-muted-foreground text-sm">No border radii found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {borders.radii.map((radius, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 border-2 border-primary/40 bg-primary/5"
                  style={{ borderRadius: radius }}
                />
                <span className="text-xs font-mono text-muted-foreground">{radius}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Breakpoints ─────────────────────────────────────────────────────────────

function BreakpointsTab({
  breakpoints,
}: {
  breakpoints: TokenData["breakpoints"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Responsive Breakpoints ({breakpoints.breakpoints.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {breakpoints.breakpoints.length === 0 ? (
          <p className="text-muted-foreground text-sm">No breakpoints extracted.</p>
        ) : (
          <div className="space-y-2">
            {breakpoints.breakpoints.map((bp, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50"
              >
                <span className="font-mono text-sm font-semibold">{bp.width}px</span>
                <span className="text-xs font-mono text-muted-foreground">{bp.query}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── CSS Variables ───────────────────────────────────────────────────────────

function VariablesTab({ variables }: { variables: Record<string, string> }) {
  const [search, setSearch] = useState("");
  const entries = Object.entries(variables).filter(
    ([k, v]) =>
      k.toLowerCase().includes(search.toLowerCase()) ||
      v.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSS Custom Properties ({Object.keys(variables).length})</CardTitle>
      </CardHeader>
      <CardContent>
        <input
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm mb-4 placeholder:text-muted-foreground"
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-96 overflow-y-auto space-y-1">
          {entries.map(([name, value]) => (
            <div
              key={name}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 text-xs font-mono"
            >
              <span className="text-foreground truncate mr-4">{name}</span>
              <span className="text-muted-foreground truncate max-w-[200px]">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
