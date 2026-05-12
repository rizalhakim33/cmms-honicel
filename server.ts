import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Lead Architect Note:
 * This server handles API routes and automated background logic (PM checks)
 * while serving the React frontend via Vite middleware.
 */

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Supabase Admin Client (optional for background tasks)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  /**
   * Logic: Auto-generate Work Orders from PM Schedules that are due.
   * In a real production app, this would be a Cron Job.
   * Here we expose it as an endpoint for demonstration.
   */
  app.post("/api/pm/sync", async (req, res) => {
    try {
      const now = new Date().toISOString();
      const { data: dueSchedules, error: pmError } = await supabase
        .from("pm_schedules")
        .select("*")
        .lte("next_due_at", now);

      if (pmError) throw pmError;

      if (dueSchedules && dueSchedules.length > 0) {
        const newWOs = dueSchedules.map(pm => ({
          asset_id: pm.asset_id,
          pm_id: pm.id,
          title: `PM Service: ${pm.title}`,
          description: `Automatically generated from PM schedule. ${pm.description || ''}`,
          status: 'open',
          priority: 'medium'
        }));

        const { error: woError } = await supabase.from("work_orders").insert(newWOs);
        if (woError) throw woError;

        // Update PM next_due_at
        // This is a simplified logic. In real CMMS, we'd calculate based on frequency.
        return res.json({ success: true, count: newWOs.length });
      }

      res.json({ success: true, count: 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[36m[Server]\x1b[0m Running on http://localhost:${PORT}`);
  });
}

startServer();
