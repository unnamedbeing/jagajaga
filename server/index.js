import "dotenv/config";
import cors from "cors";
import express from "express";
import { verifyToken } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";

const requiredEnv = ["CLERK_SECRET_KEY", "DATABASE_URL"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Missing server environment variables: ${missingEnv.join(", ")}`);
}

const app = express();
const sql = neon(process.env.DATABASE_URL);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    callback(new Error("Origin not allowed"));
  },
}));
app.use(express.json());

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.auth = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/profile", requireAuth, async (req, res) => {
  try {
    const rows = await sql`
      SELECT clerk_user_id, display_name, avatar_url, created_at
      FROM profiles
      WHERE clerk_user_id = ${req.auth.sub}
    `;

    res.json(rows[0] ?? null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load profile" });
  }
});

async function ensureProfile(userId) {
  await sql`
    INSERT INTO profiles (clerk_user_id)
    VALUES (${userId})
    ON CONFLICT (clerk_user_id) DO NOTHING
  `;
  await sql`
    INSERT INTO user_points (clerk_user_id)
    VALUES (${userId})
    ON CONFLICT (clerk_user_id) DO NOTHING
  `;
}

app.get("/api/dashboard", requireAuth, async (req, res) => {
  try {
    await ensureProfile(req.auth.sub);
    const [profile, points, savedPlaces, trips, reports] = await Promise.all([
      sql`SELECT clerk_user_id, display_name, avatar_url, created_at FROM profiles WHERE clerk_user_id = ${req.auth.sub}`,
      sql`SELECT points FROM user_points WHERE clerk_user_id = ${req.auth.sub}`,
      sql`SELECT id, label, address, longitude, latitude, created_at FROM saved_places WHERE clerk_user_id = ${req.auth.sub} ORDER BY created_at DESC`,
      sql`SELECT id, origin, destination, route_data, created_at FROM trips WHERE clerk_user_id = ${req.auth.sub} ORDER BY created_at DESC LIMIT 20`,
      sql`SELECT id, report_type, message, location_name, created_at FROM reports WHERE clerk_user_id = ${req.auth.sub} ORDER BY created_at DESC LIMIT 20`,
    ]);
    res.json({ profile: profile[0], points: points[0]?.points ?? 0, savedPlaces, trips, reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load dashboard" });
  }
});

app.post("/api/saved-places", requireAuth, async (req, res) => {
  try {
    await ensureProfile(req.auth.sub);
    const { label, address, longitude = null, latitude = null } = req.body;
    if (!label || !address) return res.status(400).json({ error: "Label and address are required" });
    const rows = await sql`
      INSERT INTO saved_places (clerk_user_id, label, address, longitude, latitude)
      VALUES (${req.auth.sub}, ${label}, ${address}, ${longitude}, ${latitude})
      RETURNING id, label, address, longitude, latitude, created_at
    `;
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save place" });
  }
});

app.post("/api/trips", requireAuth, async (req, res) => {
  try {
    await ensureProfile(req.auth.sub);
    const { origin, destination, routeData = {} } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: "Origin and destination are required" });
    const rows = await sql`
      INSERT INTO trips (clerk_user_id, origin, destination, route_data)
      VALUES (${req.auth.sub}, ${origin}, ${destination}, ${JSON.stringify(routeData)}::jsonb)
      RETURNING id, origin, destination, route_data, created_at
    `;
    await sql`UPDATE user_points SET points = points + 10, updated_at = NOW() WHERE clerk_user_id = ${req.auth.sub}`;
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save trip" });
  }
});

app.post("/api/reports", requireAuth, async (req, res) => {
  try {
    await ensureProfile(req.auth.sub);
    const { reportType, message = "", locationName = null, longitude = null, latitude = null } = req.body;
    if (!reportType) return res.status(400).json({ error: "Report type is required" });
    const rows = await sql`
      INSERT INTO reports (clerk_user_id, report_type, message, location_name, longitude, latitude)
      VALUES (${req.auth.sub}, ${reportType}, ${message}, ${locationName}, ${longitude}, ${latitude})
      RETURNING id, report_type, message, location_name, created_at
    `;
    await sql`UPDATE user_points SET points = points + 5, updated_at = NOW() WHERE clerk_user_id = ${req.auth.sub}`;
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save report" });
  }
});

app.listen(3001, () => {
  console.log("API running at http://localhost:3001");
});