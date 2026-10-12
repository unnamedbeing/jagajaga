import { neon } from '@neondatabase/serverless';

const getSql = () => neon(process.env.DATABASE_URL);

function parseCoordinates(req) {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);
  const radius = Number(req.query.radius ?? 500);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    || !Number.isFinite(radius) || radius <= 0 || radius > 10000) {
    return null;
  }
  return { latitude, longitude, radius };
}

export async function nearestStopsHandler(req, res) {
  const coordinates = parseCoordinates(req);
  if (!coordinates) return res.status(400).json({ error: 'Valid lat, lng, and radius are required.' });

  try {
    const sql = getSql();
    const { latitude, longitude, radius } = coordinates;
    for (const searchRadius of [radius, 1000, 2000]) {
      const rows = await sql`
        SELECT id, name, city, votes, source, created_at,
               ST_Y(geom::geometry) AS latitude,
               ST_X(geom::geometry) AS longitude,
               ST_Distance(
                 geom,
                 ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
               )::float AS "distanceMeters"
        FROM bus_stops
        WHERE ST_DWithin(
          geom,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${searchRadius}
        )
        ORDER BY ST_Distance(
          geom,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        )
        LIMIT 5
      `;
      if (rows.length > 0 || searchRadius === 2000) {
        return res.json({ stops: rows, radiusMeters: searchRadius });
      }
    }
  } catch (error) {
    console.error('Nearest stops query failed:', error);
    return res.status(500).json({ error: 'Could not find nearby bus stops.' });
  }
}

export default nearestStopsHandler;
