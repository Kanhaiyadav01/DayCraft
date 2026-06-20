import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sprout, Sparkles } from "lucide-react";
import { Shell } from "@/components/notebook/Shell";
import { Button, Card, Badge, StatsCard, Tape } from "@/components/notebook";
import { Plant } from "@/components/notebook/Plant";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STAGE_LABEL, type PlantStage, type Species } from "@/lib/garden";

export const Route = createFileRoute("/_authenticated/garden")({
  head: () => ({ meta: [{ title: "Focus Garden · TimeSketch" }] }),
  component: GardenPage,
});

const COLS = 8;
const ROWS = 5;

function GardenPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["garden", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: plants } = await supabase
        .from("garden_plants")
        .select("id, species, stage, position_x, position_y, planted_at")
        .order("planted_at", { ascending: true });
      return plants ?? [];
    },
  });

  const plants = data ?? [];
  const grid: Record<string, (typeof plants)[number]> = {};
  for (const p of plants) grid[`${p.position_x},${p.position_y}`] = p;

  const counts = plants.reduce<Record<PlantStage, number>>(
    (acc, p) => {
      acc[p.stage as PlantStage] = (acc[p.stage as PlantStage] ?? 0) + 1;
      return acc;
    },
    { seed: 0, sprout: 0, bud: 0, bloom: 0, tree: 0 },
  );

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="relative paper-card p-7">
            <Tape className="absolute -top-3 left-10" rotate={-3} />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-hand text-xl text-ink-soft">your patch of paper</p>
                <h1 className="font-hand text-5xl">
                  Focus <span className="highlight-marker">Garden</span> 🌱
                </h1>
                <p className="text-ink-soft mt-2 max-w-lg">
                  Every focus session plants something new. Longer sessions grow into bigger,
                  brighter plants.
                </p>
              </div>
              <Link to="/focus">
                <Button>
                  <Sparkles className="h-4 w-4" /> Start a focus session
                </Button>
              </Link>
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatsCard label="Plants" value={plants.length} tone="mint" icon={<Sprout className="h-5 w-5" />} />
            <StatsCard label="Sprouts" value={counts.sprout} tone="sky" />
            <StatsCard label="Buds" value={counts.bud} tone="tape" />
            <StatsCard label="Blooms" value={counts.bloom} tone="coral" />
            <StatsCard label="Trees" value={counts.tree} tone="accent" />
          </section>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-hand text-2xl">The garden</h3>
              <Badge tone="soft">{COLS}×{ROWS} patch</Badge>
            </div>
            <div
              className="ink-border rounded-[14px_18px_12px_20px] p-4"
              style={{
                background:
                  "repeating-linear-gradient(0deg, color-mix(in oklab, var(--mint) 25%, var(--paper-2)) 0 16px, color-mix(in oklab, var(--mint) 18%, var(--paper-2)) 16px 32px)",
              }}
            >
              <div
                className="grid gap-1 mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                  maxWidth: 720,
                }}
              >
                {Array.from({ length: COLS * ROWS }).map((_, i) => {
                  const x = i % COLS;
                  const y = Math.floor(i / COLS);
                  const p = grid[`${x},${y}`];
                  return (
                    <div
                      key={i}
                      className="aspect-square grid place-items-center relative"
                      title={p ? `${STAGE_LABEL[p.stage as PlantStage]} ${p.species}` : "empty plot"}
                    >
                      {p ? (
                        <Plant species={p.species as Species} stage={p.stage as PlantStage} size={68} delay={i * 0.03} />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-ink/15" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {!isLoading && plants.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card tilt="right">
                <p className="font-hand text-2xl">Your garden is bare paper.</p>
                <p className="text-ink-soft mt-1">
                  Start your first focus session to plant a seed.
                </p>
                <div className="mt-4">
                  <Link to="/focus">
                    <Button>
                      <Sparkles className="h-4 w-4" /> Plant your first
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </Shell>
  );
}
