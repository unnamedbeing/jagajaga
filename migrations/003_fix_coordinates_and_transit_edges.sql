UPDATE bus_stops
SET geom = ST_SetSRID(ST_MakePoint(7.4500, 8.9850), 4326)::geography
WHERE name = 'Sun City';

CREATE TABLE IF NOT EXISTS transit_edges (
  from_stop_id BIGINT NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
  to_stop_id BIGINT NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
  distance_meters DOUBLE PRECISION NOT NULL CHECK (distance_meters > 0),
  PRIMARY KEY (from_stop_id, to_stop_id),
  CHECK (from_stop_id <> to_stop_id)
);

CREATE INDEX IF NOT EXISTS transit_edges_to_stop_idx ON transit_edges(to_stop_id);

WITH named_stops AS (
  SELECT id, name
  FROM bus_stops
  WHERE name IN ('Sun City', 'Galadimawa Roundabout', 'Area 1', 'A.Y.A (Asokoro)')
),
segments(from_name, to_name) AS (
  VALUES
    ('Sun City', 'Galadimawa Roundabout'),
    ('Galadimawa Roundabout', 'Area 1'),
    ('Area 1', 'A.Y.A (Asokoro)')
),
directed_segments AS (
  SELECT from_name, to_name FROM segments
  UNION ALL
  SELECT to_name, from_name FROM segments
)
INSERT INTO transit_edges (from_stop_id, to_stop_id, distance_meters)
SELECT from_stop.id, to_stop.id,
       ST_Distance(from_stop.geom, to_stop.geom)
FROM directed_segments AS segment
JOIN named_stops AS from_stop ON from_stop.name = segment.from_name
JOIN named_stops AS to_stop ON to_stop.name = segment.to_name
ON CONFLICT (from_stop_id, to_stop_id) DO UPDATE
SET distance_meters = EXCLUDED.distance_meters;
