import { neon } from '@neondatabase/serverless';

const getSql = () => neon(process.env.DATABASE_URL);

function parseCoordinates(req) {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);
  const radius = Number(req.query.radius ?? 500);
  const excludeStopId = req.query.excludeStopId === undefined
    ? null
    : Number(req.query.excludeStopId);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    || !Number.isFinite(radius) || radius <= 0 || radius > 10000
    || (excludeStopId !== null && (!Number.isInteger(excludeStopId) || excludeStopId <= 0))) {
    return null;
  }
  return { latitude, longitude, radius, excludeStopId };
}

export async function nearestStopsHandler(req, res) {
  const coordinates = parseCoordinates(req);
  if (!coordinates) return res.status(400).json({ error: 'Valid lat, lng, and radius are required.' });

  try {
    const sql = getSql();
    const { latitude, longitude, radius, excludeStopId } = coordinates;
    const rows = await sql`
      (
        SELECT id, name, city, votes, source, stop_type, is_major, created_at,
               ST_Y(geom::geometry) AS latitude,
               ST_X(geom::geometry) AS longitude,
               ST_Distance(
                 geom,
                 ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
               )::float AS "distanceMeters"
        FROM bus_stops
        WHERE is_major = TRUE
          AND (${excludeStopId}::bigint IS NULL OR id <> ${excludeStopId})
          AND ST_DWithin(
            geom,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            10000
          )
        ORDER BY "distanceMeters" ASC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT id, name, city, votes, source, stop_type, is_major, created_at,
               ST_Y(geom::geometry) AS latitude,
               ST_X(geom::geometry) AS longitude,
               ST_Distance(
                 geom,
                 ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
               )::float AS "distanceMeters"
        FROM bus_stops
        WHERE is_major = FALSE
          AND (${excludeStopId}::bigint IS NULL OR id <> ${excludeStopId})
          AND ST_DWithin(
            geom,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${Math.min(radius, 3000)}
          )
        ORDER BY "distanceMeters" ASC
        LIMIT 5
      )
      ORDER BY is_major DESC, "distanceMeters" ASC
    `;
    return res.json({ stops: rows, radiusMeters: Math.max(10000, Math.min(radius, 3000)) });
  } catch (error) {
    console.error('Nearest stops query failed:', error);
    return res.status(500).json({ error: 'Could not find nearby bus stops.' });
  }
}

export default nearestStopsHandler;
