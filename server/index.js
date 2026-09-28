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

app.listen(3001, () => {
  console.log("API running at http://localhost:3001");
});