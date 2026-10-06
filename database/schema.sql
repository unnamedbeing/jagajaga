CREATE TABLE IF NOT EXISTS profiles (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_points (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_places (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  route_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  message TEXT,
  location_name TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_directions (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  trip_id BIGINT REFERENCES trips(id) ON DELETE CASCADE,
  direction_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_places_user_idx ON saved_places(clerk_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trips_user_idx ON trips(clerk_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_user_idx ON reports(clerk_user_id, created_at DESC);