import { neon } from '@neondatabase/serverless';

const getSql = () => neon(process.env.DATABASE_URL);

export async function locationsHandler(_req, res) {
  try {
    const sql = getSql();
    const locations = await sql`
            SELECT locations.id, stops.id AS stop_id, locations.name, locations.location_type,
              COALESCE(stops.stop_type, locations.location_type) AS stop_type,
              COALESCE(stops.is_major, FALSE) AS is_major,
             COALESCE(locations.address, stops.city) AS address,
             COALESCE(locations.longitude, ST_X(stops.geom::geometry)) AS longitude,
             COALESCE(locations.latitude, ST_Y(stops.geom::geometry)) AS latitude
      FROM managed_locations AS locations
      LEFT JOIN bus_stops AS stops
        ON LOWER(stops.name) = LOWER(locations.name)
      WHERE locations.active = TRUE
      UNION ALL
            SELECT stops.id, stops.id AS stop_id, stops.name, 'stop' AS location_type,
              stops.stop_type, stops.is_major, stops.city AS address,
             ST_X(stops.geom::geometry) AS longitude,
             ST_Y(stops.geom::geometry) AS latitude
      FROM bus_stops AS stops
      WHERE NOT EXISTS (
        SELECT 1
        FROM managed_locations AS locations
        WHERE locations.active = TRUE
          AND LOWER(locations.name) = LOWER(stops.name)
      )
      ORDER BY name
      LIMIT 500
    `;
    return res.json({ locations });
  } catch (error) {
    console.error('Managed locations query failed:', error);
    return res.status(500).json({ error: 'Could not load available locations.' });
  }
}

export default locationsHandler;
