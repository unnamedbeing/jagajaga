CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS bus_stops (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  geom GEOGRAPHY(Point, 4326) NOT NULL,
  city TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bus_stops_geom_gist_idx
  ON bus_stops USING GIST (geom);

INSERT INTO bus_stops (name, geom, city, votes, source)
VALUES
  ('National Assembly Gate', ST_SetSRID(ST_MakePoint(7.4951, 9.0556), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Three Arms Zone', ST_SetSRID(ST_MakePoint(7.4934, 9.0540), 4326)::geography, 'Abuja', 0, 'seed'),
  ('National Mosque Junction', ST_SetSRID(ST_MakePoint(7.4908, 9.0577), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Eagle Square', ST_SetSRID(ST_MakePoint(7.4918, 9.0515), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Central Bank Junction', ST_SetSRID(ST_MakePoint(7.4886, 9.0498), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Federal Secretariat', ST_SetSRID(ST_MakePoint(7.4864, 9.0468), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Millennium Park', ST_SetSRID(ST_MakePoint(7.4877, 9.0618), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Maitama Junction', ST_SetSRID(ST_MakePoint(7.5016, 9.0660), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Wuse II Junction', ST_SetSRID(ST_MakePoint(7.4722, 9.0648), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Area 1 Junction', ST_SetSRID(ST_MakePoint(7.4755, 9.0328), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Area 2 Shopping Complex', ST_SetSRID(ST_MakePoint(7.4798, 9.0270), 4326)::geography, 'Abuja', 0, 'seed'),
  ('Garki Market', ST_SetSRID(ST_MakePoint(7.4770, 9.0384), 4326)::geography, 'Abuja', 0, 'seed')
ON CONFLICT DO NOTHING;
