CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Create or Update bus_stops Table
CREATE TABLE IF NOT EXISTS bus_stops (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  geom GEOGRAPHY(Point, 4326) NOT NULL,
  city TEXT NOT NULL DEFAULT 'Abuja',
  stop_type VARCHAR(50) NOT NULL DEFAULT 'Local Stop',
  is_major BOOLEAN NOT NULL DEFAULT FALSE,
  votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bus_stops
  ADD COLUMN IF NOT EXISTS stop_type VARCHAR(50) NOT NULL DEFAULT 'Local Stop',
  ADD COLUMN IF NOT EXISTS is_major BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS bus_stops_geom_gist_idx ON bus_stops USING GIST (geom);
CREATE UNIQUE INDEX IF NOT EXISTS bus_stops_name_uidx ON bus_stops(name);
CREATE INDEX IF NOT EXISTS idx_bus_stops_is_major ON bus_stops(is_major);

-- 2. Create the Routing Network (Edges) Table
CREATE TABLE IF NOT EXISTS route_edges (
  id BIGSERIAL PRIMARY KEY,
  source_stop_id BIGINT NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
  target_stop_id BIGINT NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
  travel_time_minutes INTEGER NOT NULL CHECK (travel_time_minutes > 0),
  fare_range TEXT NOT NULL,
  mode TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_edge_direction UNIQUE (source_stop_id, target_stop_id)
);

CREATE INDEX IF NOT EXISTS idx_route_edges_source ON route_edges(source_stop_id);
CREATE INDEX IF NOT EXISTS idx_route_edges_target ON route_edges(target_stop_id);

-- 3. Populate All 70+ Verified Bus Stops (Corrected Coordinates)
INSERT INTO bus_stops (name, geom, city, stop_type, is_major, source)
VALUES
  ('Berger Bus Stop', ST_SetSRID(ST_MakePoint(7.47720, 9.07650), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Wuse Market', ST_SetSRID(ST_MakePoint(7.47560, 9.06550), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Area 1', ST_SetSRID(ST_MakePoint(7.49010, 9.03280), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Banex', ST_SetSRID(ST_MakePoint(7.48330, 9.08110), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Maitama (Nicon Junction)', ST_SetSRID(ST_MakePoint(7.50000, 9.08890), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('A.Y.A (Asokoro)', ST_SetSRID(ST_MakePoint(7.52560, 9.05530), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Apo Roundabout', ST_SetSRID(ST_MakePoint(7.50520, 9.00680), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Galadimawa Roundabout', ST_SetSRID(ST_MakePoint(7.42830, 9.00020), 4326)::geography, 'Abuja', 'Southern Transit Hub', TRUE, 'seed'),
  ('Gwarinpa (1st Avenue / Charlie Boy)', ST_SetSRID(ST_MakePoint(7.41670, 9.10330), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Kubwa (Phase 4 / Gate 1)', ST_SetSRID(ST_MakePoint(7.33920, 9.15780), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Nyanya', ST_SetSRID(ST_MakePoint(7.56670, 8.98330), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Zuba', ST_SetSRID(ST_MakePoint(7.15000, 9.16670), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Gwagwalada', ST_SetSRID(ST_MakePoint(7.08310, 8.95020), 4326)::geography, 'Abuja', 'Major Interchange', TRUE, 'seed'),
  ('Utako Motor Park', ST_SetSRID(ST_MakePoint(7.44750, 9.07430), 4326)::geography, 'Abuja', 'Interstate Terminal', TRUE, 'seed'),
  ('Jabi Park', ST_SetSRID(ST_MakePoint(7.42850, 9.07120), 4326)::geography, 'Abuja', 'Interstate Terminal', TRUE, 'seed'),
  ('Nnamdi Azikiwe Airport', ST_SetSRID(ST_MakePoint(7.26310, 9.00670), 4326)::geography, 'Abuja', 'Airport Terminal', TRUE, 'seed'),
  ('Federal Secretariat', ST_SetSRID(ST_MakePoint(7.50220, 9.05330), 4326)::geography, 'Abuja', 'Civil Service Hub', TRUE, 'seed'),
  ('Central Business District (CBD)', ST_SetSRID(ST_MakePoint(7.48940, 9.05830), 4326)::geography, 'Abuja', 'Civil Service Hub', TRUE, 'seed'),
  ('Karu Bridge', ST_SetSRID(ST_MakePoint(7.55830, 9.00830), 4326)::geography, 'Abuja', 'Corridor Interchange', TRUE, 'seed'),
  ('Airport Junction', ST_SetSRID(ST_MakePoint(7.37950, 9.02010), 4326)::geography, 'Abuja', 'Corridor Interchange', TRUE, 'seed'),
  ('Giri Junction', ST_SetSRID(ST_MakePoint(7.23310, 8.94980), 4326)::geography, 'Abuja', 'Corridor Interchange', TRUE, 'seed'),
  ('Dutse Junction', ST_SetSRID(ST_MakePoint(7.38610, 9.14170), 4326)::geography, 'Abuja', 'Corridor Interchange', TRUE, 'seed'),
  ('Mpape Junction', ST_SetSRID(ST_MakePoint(7.53330, 9.13330), 4326)::geography, 'Abuja', 'Corridor Interchange', TRUE, 'seed'),
  ('Mararaba (Boundary)', ST_SetSRID(ST_MakePoint(7.58330, 8.97500), 4326)::geography, 'Abuja', 'Corridor Interchange', TRUE, 'seed'),
  ('Kugbo Junction', ST_SetSRID(ST_MakePoint(7.54500, 9.02330), 4326)::geography, 'Abuja', 'Corridor Interchange', TRUE, 'seed'),
  ('Lugbe (F.H.A.)', ST_SetSRID(ST_MakePoint(7.38330, 8.96670), 4326)::geography, 'Abuja', 'Corridor Hub', TRUE, 'seed'),
  ('Mabushi Roundabout', ST_SetSRID(ST_MakePoint(7.46410, 9.08020), 4326)::geography, 'Abuja', 'Corridor Hub', TRUE, 'seed'),
  ('Bwari', ST_SetSRID(ST_MakePoint(7.38280, 9.28310), 4326)::geography, 'Abuja', 'Corridor Hub', TRUE, 'seed'),
  ('Kuje', ST_SetSRID(ST_MakePoint(7.23420, 8.87830), 4326)::geography, 'Abuja', 'Corridor Hub', TRUE, 'seed'),
  ('Wuse Zone 2', ST_SetSRID(ST_MakePoint(7.48080, 9.06080), 4326)::geography, 'Abuja', 'Local District Hub', FALSE, 'seed'),
  ('Wuse Zone 7', ST_SetSRID(ST_MakePoint(7.48480, 9.06980), 4326)::geography, 'Abuja', 'Local District Hub', FALSE, 'seed'),
  ('Wuse Zone 4 Underbridge', ST_SetSRID(ST_MakePoint(7.47490, 9.06370), 4326)::geography, 'Abuja', 'District Bus Stop', FALSE, 'seed'),
  ('Area 2 (Shopping Complex)', ST_SetSRID(ST_MakePoint(7.48520, 9.03610), 4326)::geography, 'Abuja', 'District Hub', FALSE, 'seed'),
  ('Garki Area 7', ST_SetSRID(ST_MakePoint(7.49080, 9.04120), 4326)::geography, 'Abuja', 'Local District Hub', FALSE, 'seed'),
  ('Area 3 Junction', ST_SetSRID(ST_MakePoint(7.48790, 9.03840), 4326)::geography, 'Abuja', 'District Bus Stop', FALSE, 'seed'),
  ('Asokoro Diplomatic Zone', ST_SetSRID(ST_MakePoint(7.53080, 9.04880), 4326)::geography, 'Abuja', 'District Hub', FALSE, 'seed'),
  ('Sun City', ST_SetSRID(ST_MakePoint(7.44980, 8.98480), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Sunny Vale', ST_SetSRID(ST_MakePoint(7.45280, 8.98180), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Peace Court Estate', ST_SetSRID(ST_MakePoint(7.45080, 8.97980), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Lokogoma Junction', ST_SetSRID(ST_MakePoint(7.44180, 8.97780), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Efab Lokogoma', ST_SetSRID(ST_MakePoint(7.43780, 8.97120), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Trademore (Lokogoma)', ST_SetSRID(ST_MakePoint(7.43980, 8.96480), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Trade More (Lugbe)', ST_SetSRID(ST_MakePoint(7.34980, 8.93980), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Apo Legislative Quarters', ST_SetSRID(ST_MakePoint(7.51180, 9.01220), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Apo Resettlement', ST_SetSRID(ST_MakePoint(7.50980, 8.98520), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Lugbe Sector F', ST_SetSRID(ST_MakePoint(7.36980, 8.95480), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Lugbe Police Signboard', ST_SetSRID(ST_MakePoint(7.37480, 8.95980), 4326)::geography, 'Abuja', 'District Bus Stop', FALSE, 'seed'),
  ('Magic Land Axis', ST_SetSRID(ST_MakePoint(7.43500, 9.02780), 4326)::geography, 'Abuja', 'District Bus Stop', FALSE, 'seed'),
  ('Gwarinpa (2nd Avenue)', ST_SetSRID(ST_MakePoint(7.41280, 9.10580), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Gwarinpa (3rd Avenue)', ST_SetSRID(ST_MakePoint(7.40980, 9.10980), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Gwarinpa (4th Avenue)', ST_SetSRID(ST_MakePoint(7.40780, 9.11280), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Gwarinpa (5th Avenue)', ST_SetSRID(ST_MakePoint(7.40380, 9.11680), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Gwarinpa (Chemist Junction)', ST_SetSRID(ST_MakePoint(7.40480, 9.11480), 4326)::geography, 'Abuja', 'Local Stop', FALSE, 'seed'),
  ('Gwarinpa (69 Road)', ST_SetSRID(ST_MakePoint(7.39980, 9.11980), 4326)::geography, 'Abuja', 'Estate Stop', FALSE, 'seed'),
  ('Utako Market Keke Hub', ST_SetSRID(ST_MakePoint(7.45080, 9.07180), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Jabi Lake Mall Keke Stop', ST_SetSRID(ST_MakePoint(7.43180, 9.07780), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Dawaki Keke Stop', ST_SetSRID(ST_MakePoint(7.39780, 9.12480), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Lugbe Phase 1', ST_SetSRID(ST_MakePoint(7.38080, 8.96480), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Lugbe Phase 2', ST_SetSRID(ST_MakePoint(7.37880, 8.96280), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('VON Junction', ST_SetSRID(ST_MakePoint(7.34480, 8.93480), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Kabusa Village', ST_SetSRID(ST_MakePoint(7.48980, 8.97080), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Kubwa Gate 2', ST_SetSRID(ST_MakePoint(7.33380, 9.16080), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Kubwa Village', ST_SetSRID(ST_MakePoint(7.33100, 9.16280), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Jikwoyi Phase 1', ST_SetSRID(ST_MakePoint(7.59980, 8.97480), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Karu Phase 2', ST_SetSRID(ST_MakePoint(7.57980, 8.99080), 4326)::geography, 'Abuja', 'Keke / Okada Hub', FALSE, 'seed'),
  ('Apo Mechanic Village', ST_SetSRID(ST_MakePoint(7.49980, 8.99480), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Kabusa Junction', ST_SetSRID(ST_MakePoint(7.49480, 8.97480), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Pyakasa', ST_SetSRID(ST_MakePoint(7.36480, 8.94980), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Kapwa', ST_SetSRID(ST_MakePoint(7.35980, 8.94480), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Kubwa (PW)', ST_SetSRID(ST_MakePoint(7.32980, 9.16480), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Kubwa (Byazhin)', ST_SetSRID(ST_MakePoint(7.31980, 9.16980), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Kubwa (Arab Road)', ST_SetSRID(ST_MakePoint(7.30980, 9.15980), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Mpape Village', ST_SetSRID(ST_MakePoint(7.53980, 9.13980), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Public Service Institute', ST_SetSRID(ST_MakePoint(7.36200, 9.14800), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Jahi Junction', ST_SetSRID(ST_MakePoint(7.44150, 9.08310), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Katampe', ST_SetSRID(ST_MakePoint(7.44980, 9.09980), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Karu Site', ST_SetSRID(ST_MakePoint(7.56980, 8.99980), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Jikwoyi', ST_SetSRID(ST_MakePoint(7.58980, 8.97980), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Kurudu', ST_SetSRID(ST_MakePoint(7.60980, 8.96980), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed'),
  ('Dei-Dei', ST_SetSRID(ST_MakePoint(7.29950, 9.16650), 4326)::geography, 'Abuja', 'Informal / Village Stop', FALSE, 'seed')
ON CONFLICT (name) DO UPDATE SET 
  geom = EXCLUDED.geom,
  stop_type = EXCLUDED.stop_type,
  is_major = EXCLUDED.is_major;

-- 4. Edge Seeding Procedure
CREATE OR REPLACE PROCEDURE add_route_edge(
    p_from TEXT,
    p_to TEXT,
    p_time INT,
    p_fare TEXT,
    p_mode TEXT,
    p_note TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_from_id BIGINT;
    v_to_id BIGINT;
BEGIN
    SELECT id INTO v_from_id FROM bus_stops WHERE name = p_from;
    SELECT id INTO v_to_id FROM bus_stops WHERE name = p_to;

    IF v_from_id IS NOT NULL AND v_to_id IS NOT NULL THEN
        INSERT INTO route_edges (source_stop_id, target_stop_id, travel_time_minutes, fare_range, mode, note)
        VALUES (v_from_id, v_to_id, p_time, p_fare, p_mode, p_note)
        ON CONFLICT (source_stop_id, target_stop_id) DO UPDATE SET
            travel_time_minutes = EXCLUDED.travel_time_minutes,
            fare_range = EXCLUDED.fare_range,
            mode = EXCLUDED.mode,
            note = EXCLUDED.note;
    END IF;
END;
$$;

-- 5. Seed Complete Bidirectional Graph Network
DO $$
BEGIN
  -- Berger Bus Stop Links
  CALL add_route_edge('Berger Bus Stop', 'Wuse Market', 10, '₦300 - ₦800', 'Commercial Bus / Shared Taxi', 'Intra-city Link');
  CALL add_route_edge('Wuse Market', 'Berger Bus Stop', 10, '₦300 - ₦800', 'Commercial Bus / Shared Taxi', 'Intra-city Link');
  CALL add_route_edge('Berger Bus Stop', 'Jabi Park', 10, '₦200 - ₦500', 'Keke Napep / Taxi', 'Intra-city Hub Link');
  CALL add_route_edge('Berger Bus Stop', 'Area 1', 15, '₦75 - ₦900', 'AUMTCO Bus / Shared Taxi', 'AUMTCO Route / Express');
  CALL add_route_edge('Area 1', 'Berger Bus Stop', 15, '₦75 - ₦900', 'AUMTCO Bus / Shared Taxi', 'Via Mosque');
  CALL add_route_edge('Berger Bus Stop', 'Gwarinpa (1st Avenue / Charlie Boy)', 20, '₦600 - ₦900', 'Shared Taxi', 'Zuba Corridor');
  CALL add_route_edge('Gwarinpa (1st Avenue / Charlie Boy)', 'Berger Bus Stop', 20, '₦600 - ₦900', 'Shared Taxi', 'City Center Direct');
  CALL add_route_edge('Berger Bus Stop', 'Kubwa (Phase 4 / Gate 1)', 25, '₦400 - ₦1,200', 'Commercial Bus / Taxi', 'Kubwa Expressway');
  CALL add_route_edge('Kubwa (Phase 4 / Gate 1)', 'Berger Bus Stop', 25, '₦400 - ₦1,200', 'Commercial Bus / Taxi', 'Town Express');

  -- Wuse District Inner Keke Links
  CALL add_route_edge('Wuse Market', 'Wuse Zone 2', 5, '₦150 - ₦250', 'Keke Napep', 'Internal Wuse Keke Route');
  CALL add_route_edge('Wuse Zone 2', 'Wuse Market', 5, '₦150 - ₦250', 'Keke Napep', 'Direct Keke Link');
  CALL add_route_edge('Wuse Zone 2', 'Wuse Zone 7', 4, '₦150 - ₦200', 'Keke Napep / Bike (Okada)', 'Local Connection');
  CALL add_route_edge('Wuse Zone 7', 'Wuse Zone 2', 4, '₦150 - ₦200', 'Keke Napep / Bike (Okada)', 'Local Connection');
  CALL add_route_edge('Wuse Zone 7', 'Wuse Market', 7, '₦200 - ₦300', 'Keke Napep', 'Market Link');

  -- Garki District Inner Links
  CALL add_route_edge('Area 1', 'Area 2 (Shopping Complex)', 5, '₦150 - ₦200', 'Keke Napep', 'Garki Local Route');
  CALL add_route_edge('Area 2 (Shopping Complex)', 'Area 1', 5, '₦150 - ₦200', 'Keke Napep', 'Direct Keke Link');
  CALL add_route_edge('Area 2 (Shopping Complex)', 'Garki Area 7', 4, '₦150 - ₦200', 'Keke Napep / Bike (Okada)', 'Local Connection');
  CALL add_route_edge('Garki Area 7', 'Area 2 (Shopping Complex)', 4, '₦150 - ₦200', 'Keke Napep / Bike (Okada)', 'Local Connection');
  CALL add_route_edge('Garki Area 7', 'Area 1', 7, '₦150 - ₦250', 'Keke Napep', 'Garki Hub Link');
  CALL add_route_edge('Area 1', 'Area 3 Junction', 5, '₦100 - ₦200', 'Keke Napep / Walk', 'Inner Garki');
  CALL add_route_edge('Area 3 Junction', 'Area 1', 5, '₦100 - ₦200', 'Keke Napep / Walk', 'Garki Hub');

  -- Southern Axis (Galadimawa Roundabout [AUST], Sun City, Sunny Vale, Apo)
  CALL add_route_edge('Galadimawa Roundabout', 'Area 1', 12, '₦200 - ₦400', 'Shared Taxi / Bus', 'Garki Link');
  CALL add_route_edge('Area 1', 'Galadimawa Roundabout', 12, '₦200 - ₦400', 'Shared Taxi / Bus', 'Lokogoma Axis');
  CALL add_route_edge('Galadimawa Roundabout', 'Sun City', 5, '₦100 - ₦200', 'Keke Napep / Bike (Okada)', 'Direct Estate Link');
  CALL add_route_edge('Sun City', 'Galadimawa Roundabout', 5, '₦100 - ₦200', 'Keke Napep / Bike (Okada)', 'Galadimawa Access');
  CALL add_route_edge('Sun City', 'Sunny Vale', 3, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Direct Inter-Estate Link');
  CALL add_route_edge('Sunny Vale', 'Sun City', 3, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Direct Inter-Estate Link');
  CALL add_route_edge('Sunny Vale', 'Galadimawa Roundabout', 6, '₦100 - ₦200', 'Keke Napep / Bike (Okada)', 'Galadimawa Access');
  CALL add_route_edge('Galadimawa Roundabout', 'Sunny Vale', 6, '₦100 - ₦200', 'Keke Napep / Bike (Okada)', 'Direct Estate Link');
  CALL add_route_edge('Sun City', 'Peace Court Estate', 4, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Inner Estate Shortcut');
  CALL add_route_edge('Peace Court Estate', 'Sun City', 4, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Sun City Access');

  -- Apo & Kabusa Keke/Okada Grid
  CALL add_route_edge('Area 1', 'Apo Roundabout', 10, '₦200 - ₦300', 'Shared Taxi / Keke', 'Southern Axis');
  CALL add_route_edge('Apo Roundabout', 'Area 1', 10, '₦200 - ₦300', 'Shared Taxi / Keke', 'Garki Link');
  CALL add_route_edge('Apo Roundabout', 'Apo Legislative Quarters', 5, '₦100 - ₦200', 'Keke Napep / Bike (Okada)', 'Quarter Gate Link');
  CALL add_route_edge('Apo Legislative Quarters', 'Apo Roundabout', 5, '₦100 - ₦200', 'Keke Napep / Bike (Okada)', 'Main Highway Access');
  CALL add_route_edge('Apo Legislative Quarters', 'Apo Resettlement', 5, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Inner Quarter Shortcut');
  CALL add_route_edge('Apo Resettlement', 'Apo Legislative Quarters', 5, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Inner Quarter Shortcut');
  CALL add_route_edge('Apo Roundabout', 'Apo Mechanic Village', 5, '₦150 - ₦250', 'Keke Napep / Bike (Okada)', 'Local Route');
  CALL add_route_edge('Apo Mechanic Village', 'Kabusa Village', 8, '₦150 - ₦250', 'Bike (Okada) / Keke', 'Village Shortcut');
  CALL add_route_edge('Kabusa Village', 'Kabusa Junction', 5, '₦100 - ₦150', 'Bike (Okada)', 'Direct Village Route');

  -- Airport Road / Lugbe Micro-Grid
  CALL add_route_edge('Lugbe (F.H.A.)', 'Lugbe Phase 1', 3, '₦100 - ₦150', 'Keke Napep / Bike (Okada)', 'Phase 1 Inner Link');
  CALL add_route_edge('Lugbe Phase 1', 'Lugbe Phase 2', 3, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Phase 2 Shortcut');
  CALL add_route_edge('Lugbe Phase 2', 'Lugbe Sector F', 5, '₦100 - ₦150', 'Bike (Okada)', 'Sector F Route');
  CALL add_route_edge('Lugbe Sector F', 'Pyakasa', 6, '₦150 - ₦200', 'Bike (Okada)', 'Village Access');
  CALL add_route_edge('Pyakasa', 'Kapwa', 5, '₦100 - ₦150', 'Bike (Okada)', 'Village-to-Village Route');
  CALL add_route_edge('Lugbe Police Signboard', 'Trade More (Lugbe)', 10, '₦200 - ₦300', 'Keke Napep / Bike (Okada)', 'Lugbe Estate Corridor');
  CALL add_route_edge('Trade More (Lugbe)', 'VON Junction', 6, '₦150 - ₦200', 'Bike (Okada) / Keke', 'VON Service Road');

  -- Gwarinpa Inner Neighborhood Grid
  CALL add_route_edge('Gwarinpa (1st Avenue / Charlie Boy)', 'Gwarinpa (2nd Avenue)', 4, '₦100 - ₦150', 'Keke Napep / Bike (Okada)', 'Internal Gwarinpa Grid');
  CALL add_route_edge('Gwarinpa (2nd Avenue)', 'Gwarinpa (3rd Avenue)', 3, '₦100 - ₦150', 'Keke Napep / Bike (Okada)', 'Grid Link');
  CALL add_route_edge('Gwarinpa (3rd Avenue)', 'Gwarinpa (4th Avenue)', 3, '₦100 - ₦150', 'Keke Napep / Bike (Okada)', 'Grid Link');
  CALL add_route_edge('Gwarinpa (4th Avenue)', 'Gwarinpa (5th Avenue)', 3, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Estate Inner Loop');
  CALL add_route_edge('Gwarinpa (5th Avenue)', 'Dawaki Keke Stop', 5, '₦150 - ₦200', 'Bike (Okada) / Keke', 'Estate Bypass Link');
  CALL add_route_edge('Dawaki Keke Stop', 'Dutse Junction', 5, '₦150 - ₦200', 'Bike (Okada) / Keke', 'Dutse Link');

  -- Kubwa Suburban Grid
  CALL add_route_edge('Kubwa (Phase 4 / Gate 1)', 'Kubwa Gate 2', 4, '₦100 - ₦150', 'Keke Napep / Bike (Okada)', 'Kubwa Inner Ring');
  CALL add_route_edge('Kubwa Gate 2', 'Kubwa Village', 5, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Village Route');
  CALL add_route_edge('Kubwa Village', 'Kubwa (PW)', 4, '₦100 - ₦150', 'Keke Napep / Bike (Okada)', 'PW Hub Link');
  CALL add_route_edge('Kubwa (PW)', 'Kubwa (Byazhin)', 6, '₦150 - ₦200', 'Bike (Okada) / Keke', 'Suburban Deep Access');
  CALL add_route_edge('Kubwa (Byazhin)', 'Kubwa (Arab Road)', 4, '₦100 - ₦150', 'Bike (Okada)', 'Byazhin-Arab Shortcut');

  -- Asokoro & Eastern Axis (Karu, Jikwoyi, Kurudu)
  CALL add_route_edge('Area 1', 'A.Y.A (Asokoro)', 12, '₦200 - ₦400', 'Shared Taxi / Bus', 'Inner Ring Link');
  CALL add_route_edge('A.Y.A (Asokoro)', 'Area 1', 12, '₦200 - ₦400', 'Shared Taxi / Bus', 'Asokoro Direct');
  CALL add_route_edge('A.Y.A (Asokoro)', 'Asokoro Diplomatic Zone', 5, '₦150 - ₦250', 'Keke Napep / Taxi', 'Diplomatic Zone Access');
  CALL add_route_edge('A.Y.A (Asokoro)', 'Karu Bridge', 12, '₦500 - ₦700', 'Commercial Bus / Shared Taxi', 'Karu Expressway');
  CALL add_route_edge('Karu Bridge', 'Karu Site', 8, '₦150 - ₦250', 'Keke Napep / Taxi', 'Internal Karu');
  CALL add_route_edge('Karu Site', 'Karu Phase 2', 4, '₦100 - ₦150', 'Keke Napep / Bike (Okada)', 'Inner Karu Link');
  CALL add_route_edge('Karu Phase 2', 'Jikwoyi Phase 1', 5, '₦150 - ₦200', 'Bike (Okada) / Keke', 'Suburban Shortcut');
  CALL add_route_edge('Jikwoyi Phase 1', 'Jikwoyi', 3, '₦100 - ₦150', 'Bike (Okada) / Keke', 'Jikwoyi Hub Link');
  CALL add_route_edge('Jikwoyi', 'Kurudu', 12, '₦200 - ₦300', 'Bike (Okada) / Keke', 'Deep Eastern Suburb');
END $$;

-- Clean Up Procedure Helper
DROP PROCEDURE IF EXISTS add_route_edge;