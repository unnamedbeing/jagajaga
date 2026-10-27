import { neon } from '@neondatabase/serverless';

const getSql = () => neon(process.env.DATABASE_URL);

function parseStopId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function findShortestPath(edges, originId, destinationId) {
  const graph = new Map();
  for (const edge of edges) {
    const fromId = Number(edge.from_id);
    const toId = Number(edge.to_id);
    if (!graph.has(fromId)) graph.set(fromId, []);
    graph.get(fromId).push({ ...edge, from_id: fromId, to_id: toId });
  }

  const distances = new Map([[originId, 0]]);
  const previous = new Map();
  const pending = new Set([originId]);

  while (pending.size > 0) {
    let currentId = null;
    let currentDistance = Infinity;
    for (const id of pending) {
      const distance = distances.get(id) ?? Infinity;
      if (distance < currentDistance) {
        currentId = id;
        currentDistance = distance;
      }
    }
    if (currentId === null) break;
    pending.delete(currentId);
    if (currentId === destinationId) break;

    for (const edge of graph.get(currentId) || []) {
      const nextDistance = currentDistance + Number(edge.travel_time_minutes);
      if (nextDistance < (distances.get(edge.to_id) ?? Infinity)) {
        distances.set(edge.to_id, nextDistance);
        previous.set(edge.to_id, edge);
        pending.add(edge.to_id);
      }
    }
  }

  if (!distances.has(destinationId)) return null;
  const path = [destinationId];
  const pathEdges = [];
  for (let id = destinationId; id !== originId;) {
    const edge = previous.get(id);
    if (!edge) return null;
    pathEdges.unshift(edge);
    id = edge.from_id;
    path.unshift(id);
  }
  return { stopIds: path, totalTimeMinutes: distances.get(destinationId), edges: pathEdges };
}

export async function transitRouteHandler(req, res) {
  const originStopId = parseStopId(req.query.originStopId);
  const destinationStopId = parseStopId(req.query.destinationStopId);
  if (!originStopId || !destinationStopId) {
    return res.status(400).json({ error: 'Valid originStopId and destinationStopId are required.' });
  }
  if (originStopId === destinationStopId) {
    return res.status(400).json({ error: 'Origin and destination must be different stops.' });
  }

  try {
    const sql = getSql();
    const rows = await sql`
            SELECT source_stop_id AS from_id, target_stop_id AS to_id,
              travel_time_minutes, fare_range, mode, note
            FROM route_edges
    `;
    const route = findShortestPath(rows, originStopId, destinationStopId);
    if (!route) return res.status(404).json({ error: 'No transit route available' });

    const stops = await sql`
      SELECT id, name, ST_Y(geom::geometry) AS latitude, ST_X(geom::geometry) AS longitude
      FROM bus_stops
      WHERE id = ANY(${route.stopIds}::bigint[])
      ORDER BY array_position(${route.stopIds}::bigint[], id)
    `;
    return res.json({
      stopIds: route.stopIds,
      totalTimeMinutes: route.totalTimeMinutes,
      stops,
      segments: route.edges,
    });
  } catch (error) {
    console.error('Transit route query failed:', error);
    return res.status(500).json({ error: 'Could not calculate a transit route.' });
  }
}

export default transitRouteHandler;
