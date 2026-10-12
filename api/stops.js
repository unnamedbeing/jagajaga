import { neon } from '@neondatabase/serverless';

const getSql = () => neon(process.env.DATABASE_URL);

export async function stopsHandler(req, res) {
  const { name, city = 'Abuja', latitude, longitude } = req.body || {};
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120
    || typeof city !== 'string' || city.trim().length < 2 || city.trim().length > 80
    || !Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90
    || !Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
    return res.status(400).json({ error: 'A valid stop name, city, latitude, and longitude are required.' });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO bus_stops (name, geom, city, votes, source)
      VALUES (${name.trim()}, ST_SetSRID(ST_MakePoint(${parsedLongitude}, ${parsedLatitude}), 4326)::geography, ${city.trim()}, 0, 'user')
      RETURNING id, name, city, votes, source, created_at,
                ST_Y(geom::geometry) AS latitude,
                ST_X(geom::geometry) AS longitude
    `;
    return res.status(201).json({ stop: rows[0] });
  } catch (error) {
    console.error('Stop suggestion insert failed:', error);
    return res.status(500).json({ error: 'Could not add the suggested stop.' });
  }
}

export default stopsHandler;
