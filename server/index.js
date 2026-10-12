import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import nearestStopsHandler from "../api/nearest-stops.js";
import stopsHandler from "../api/stops.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const requiredEnv = ["CLERK_SECRET_KEY", "DATABASE_URL"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Missing server environment variables: ${missingEnv.join(", ")}`);
}

const app = express();
const sql = neon(process.env.DATABASE_URL);
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const adminEmails = new Set((process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));

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
      clockSkewInMs: 30_000,
    });

    next();
  } catch (error) {
    console.error("Clerk token verification failed:", error.message);
    res.status(401).json({ error: "Unauthorized" });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/nearest-stops", nearestStopsHandler);
app.post("/api/stops", stopsHandler);

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
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses.find((address) => address.id === clerkUser.primaryEmailAddressId)?.emailAddress || null;
  await sql`
    INSERT INTO profiles (clerk_user_id, email, display_name, avatar_url)
    VALUES (${userId}, ${email}, ${clerkUser.fullName || clerkUser.username || null}, ${clerkUser.imageUrl || null})
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url)
  `;
  await sql`
    INSERT INTO user_points (clerk_user_id)
    VALUES (${userId})
    ON CONFLICT (clerk_user_id) DO NOTHING
  `;
}

async function requireAdmin(req, res, next) {
  try {
    await ensureProfile(req.auth.sub);
    const rows = await sql`SELECT email FROM profiles WHERE clerk_user_id = ${req.auth.sub}`;
    if (!rows[0]?.email || !adminEmails.has(rows[0].email.toLowerCase())) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Admin authorization failed:", error.message);
    res.status(403).json({ error: "Admin access required" });
  }
}

app.get("/api/dashboard", requireAuth, async (req, res) => {
  try {
    await ensureProfile(req.auth.sub);
    const [profile, points, savedPlaces, trips, reports] = await Promise.all([
      sql`SELECT clerk_user_id, display_name, avatar_url, created_at FROM profiles WHERE clerk_user_id = ${req.auth.sub}`,
      sql`SELECT points FROM user_points WHERE clerk_user_id = ${req.auth.sub}`,
      sql`SELECT id, label, address, longitude, latitude, created_at FROM saved_places WHERE clerk_user_id = ${req.auth.sub} ORDER BY created_at DESC`,
      sql`SELECT id, route_name, origin, destination, route_data, created_at FROM trips WHERE clerk_user_id = ${req.auth.sub} ORDER BY created_at DESC LIMIT 20`,
      sql`SELECT id, report_type, message, location_name, created_at FROM reports WHERE clerk_user_id = ${req.auth.sub} ORDER BY created_at DESC LIMIT 20`,
    ]);
    res.json({ profile: profile[0], points: points[0]?.points ?? 0, savedPlaces, trips, reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load dashboard" });
  }
});

app.get("/api/admin/reports", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const reports = await sql`
      SELECT reports.id, reports.report_type, reports.message, reports.location_name,
             reports.longitude, reports.latitude, reports.created_at,
             profiles.email, profiles.display_name
      FROM reports
      LEFT JOIN profiles ON profiles.clerk_user_id = reports.clerk_user_id
      ORDER BY reports.created_at DESC
      LIMIT 200
    `;
    res.json({ reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load admin reports" });
  }
});

app.post("/api/searches", requireAuth, async (req, res) => {
  try {
    await ensureProfile(req.auth.sub);
    const { origin, destination } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: "Origin and destination are required" });
    await sql`
      INSERT INTO search_events (clerk_user_id, origin, destination)
      VALUES (${req.auth.sub}, ${origin}, ${destination})
    `;
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not record search" });
  }
});

app.get("/api/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [summary, dailySearches, popularRoutes, topOrigins, topDestinations, feedbackVolume] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '30 days') AS new_signups,
          (SELECT COUNT(*) FROM (
            SELECT DISTINCT clerk_user_id FROM search_events WHERE created_at >= NOW() - INTERVAL '30 days'
            UNION
            SELECT DISTINCT clerk_user_id FROM trips WHERE created_at >= NOW() - INTERVAL '30 days'
            UNION
            SELECT DISTINCT clerk_user_id FROM reports WHERE created_at >= NOW() - INTERVAL '30 days'
          ) AS active_user_ids) AS active_users,
          (SELECT COUNT(*) FROM search_events WHERE created_at >= CURRENT_DATE) AS daily_searches
      `,
      sql`SELECT DATE(created_at) AS day, COUNT(*)::int AS searches FROM search_events WHERE created_at >= NOW() - INTERVAL '14 days' GROUP BY DATE(created_at) ORDER BY day`,
      sql`SELECT origin, destination, COUNT(*)::int AS searches FROM search_events GROUP BY origin, destination ORDER BY searches DESC LIMIT 10`,
      sql`SELECT origin AS area, COUNT(*)::int AS searches FROM search_events GROUP BY origin ORDER BY searches DESC LIMIT 8`,
      sql`SELECT destination AS area, COUNT(*)::int AS searches FROM search_events GROUP BY destination ORDER BY searches DESC LIMIT 8`,
      sql`SELECT DATE(created_at) AS day, COUNT(*)::int AS reports FROM reports WHERE created_at >= NOW() - INTERVAL '14 days' GROUP BY DATE(created_at) ORDER BY day`,
    ]);
    res.json({ summary: summary[0], dailySearches, popularRoutes, topOrigins, topDestinations, feedbackVolume });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load admin overview" });
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
    const { routeName = "Saved route", origin, destination, routeData = {} } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: "Origin and destination are required" });
    const rows = await sql`
      INSERT INTO trips (clerk_user_id, route_name, origin, destination, route_data)
      VALUES (${req.auth.sub}, ${routeName}, ${origin}, ${destination}, ${JSON.stringify(routeData)}::jsonb)
      RETURNING id, route_name, origin, destination, route_data, created_at
    `;
    await sql`UPDATE user_points SET points = points + 10, updated_at = NOW() WHERE clerk_user_id = ${req.auth.sub}`;
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save trip" });
  }
});

app.patch("/api/trips/:tripId", requireAuth, async (req, res) => {
  try {
    const { routeName = null, origin = null, destination = null } = req.body;
    if (routeName !== null && !routeName.trim()) return res.status(400).json({ error: "Route name is required" });
    if (origin !== null && !origin.trim()) return res.status(400).json({ error: "Start location is required" });
    if (destination !== null && !destination.trim()) return res.status(400).json({ error: "End location is required" });
    const rows = await sql`
      UPDATE trips
      SET route_name = COALESCE(${routeName?.trim() ?? null}, route_name),
          origin = COALESCE(${origin?.trim() ?? null}, origin),
          destination = COALESCE(${destination?.trim() ?? null}, destination)
      WHERE id = ${req.params.tripId} AND clerk_user_id = ${req.auth.sub}
      RETURNING id, route_name, origin, destination, route_data, created_at
    `;
    if (!rows[0]) return res.status(404).json({ error: "Saved route not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not rename saved route" });
  }
});

app.delete("/api/trips/:tripId", requireAuth, async (req, res) => {
  try {
    const rows = await sql`
      DELETE FROM trips
      WHERE id = ${req.params.tripId} AND clerk_user_id = ${req.auth.sub}
      RETURNING id
    `;
    if (!rows[0]) return res.status(404).json({ error: "Saved place not found" });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete saved place" });
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

app.post("/api/route-submissions", requireAuth, async (req, res) => {
  try {
    await ensureProfile(req.auth.sub);
    const { origin, destination, stops = [], fare = "", landmarks = "" } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: "Origin and destination are required" });
    const rows = await sql`
      INSERT INTO route_submissions (clerk_user_id, origin, destination, stops, fare, landmarks)
      VALUES (${req.auth.sub}, ${origin}, ${destination}, ${JSON.stringify(stops)}::jsonb, ${fare}, ${landmarks})
      RETURNING id, origin, destination, stops, fare, landmarks, status, created_at
    `;
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not submit route" });
  }
});

app.post("/api/route-feedback", requireAuth, async (req, res) => {
  try {
    await ensureProfile(req.auth.sub);
    const { routeName, routeSubmissionId = null, rating, comment = "", tags = [] } = req.body;
    if (!routeName || !Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: "Route name and a rating from 1 to 5 are required" });
    const rows = await sql`
      INSERT INTO route_feedback (clerk_user_id, route_submission_id, route_name, rating, comment, tags)
      VALUES (${req.auth.sub}, ${routeSubmissionId}, ${routeName}, ${rating}, ${comment}, ${tags})
      RETURNING id, route_name, rating, comment, tags, status, created_at
    `;
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save route feedback" });
  }
});

app.get("/api/announcements", requireAuth, async (_req, res) => {
  const rows = await sql`SELECT id, title, message, created_at FROM announcements WHERE published = TRUE ORDER BY created_at DESC LIMIT 20`;
  res.json({ announcements: rows });
});

app.get("/api/admin/management", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [submissions, feedback, users, locations, announcements] = await Promise.all([
      sql`SELECT route_submissions.*, profiles.email FROM route_submissions LEFT JOIN profiles ON profiles.clerk_user_id = route_submissions.clerk_user_id ORDER BY route_submissions.created_at DESC LIMIT 100`,
      sql`SELECT route_feedback.*, profiles.email FROM route_feedback LEFT JOIN profiles ON profiles.clerk_user_id = route_feedback.clerk_user_id ORDER BY route_feedback.created_at DESC LIMIT 100`,
      sql`SELECT clerk_user_id, email, display_name, created_at FROM profiles ORDER BY created_at DESC LIMIT 200`,
      sql`SELECT * FROM managed_locations ORDER BY name LIMIT 200`,
      sql`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 100`,
    ]);
    res.json({ submissions, feedback, users, locations, announcements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load admin management data" });
  }
});

app.patch("/api/admin/route-submissions/:id", requireAuth, requireAdmin, async (req, res) => {
  const { status, adminNote = "", origin, destination, stops = [], fare = "", landmarks = "" } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: "Invalid submission status" });
  const rows = await sql`
    UPDATE route_submissions SET status = ${status}, admin_note = ${adminNote}, origin = COALESCE(${origin || null}, origin), destination = COALESCE(${destination || null}, destination), stops = ${JSON.stringify(stops)}::jsonb, fare = ${fare}, landmarks = ${landmarks}, updated_at = NOW()
    WHERE id = ${req.params.id} RETURNING *
  `;
  if (!rows[0]) return res.status(404).json({ error: "Route submission not found" });
  res.json(rows[0]);
});

app.patch("/api/admin/feedback/:id", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: "Invalid feedback status" });
  const rows = await sql`UPDATE route_feedback SET status = ${status} WHERE id = ${req.params.id} RETURNING *`;
  if (!rows[0]) return res.status(404).json({ error: "Feedback not found" });
  res.json(rows[0]);
});

app.post("/api/admin/locations", requireAuth, requireAdmin, async (req, res) => {
  const { name, locationType = "stop", address = "", longitude = null, latitude = null } = req.body;
  if (!name) return res.status(400).json({ error: "Location name is required" });
  const rows = await sql`INSERT INTO managed_locations (name, location_type, address, longitude, latitude) VALUES (${name}, ${locationType}, ${address}, ${longitude}, ${latitude}) RETURNING *`;
  res.status(201).json(rows[0]);
});

app.post("/api/admin/announcements", requireAuth, requireAdmin, async (req, res) => {
  const { title, message, published = true } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Title and message are required" });
  const rows = await sql`INSERT INTO announcements (clerk_user_id, title, message, published) VALUES (${req.auth.sub}, ${title}, ${message}, ${published}) RETURNING *`;
  res.status(201).json(rows[0]);
});

app.listen(3001, () => {
  console.log("API running at http://localhost:3001");
});