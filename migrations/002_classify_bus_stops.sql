ALTER TABLE bus_stops
  ADD COLUMN IF NOT EXISTS stop_type VARCHAR(50) NOT NULL DEFAULT 'Local Stop',
  ADD COLUMN IF NOT EXISTS is_major BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_bus_stops_is_major ON bus_stops(is_major);
CREATE INDEX IF NOT EXISTS idx_bus_stops_stop_type ON bus_stops(stop_type);

UPDATE bus_stops
SET stop_type = 'Major Interchange', is_major = TRUE
WHERE name IN (
  'Berger Bus Stop', 'Wuse Market', 'Area 1', 'Banex',
  'Maitama (Nicon Junction)', 'A.Y.A (Asokoro)', 'Apo Roundabout',
  'Galadimawa Roundabout', 'Gwarinpa (1st Avenue / Charlie Boy)',
  'Kubwa (Phase 4 / Gate 1)', 'Nyanya', 'Zuba', 'Gwagwalada'
);

UPDATE bus_stops
SET stop_type = 'Interstate Terminal', is_major = TRUE
WHERE name IN ('Utako Motor Park', 'Jabi Park');

UPDATE bus_stops
SET stop_type = 'Airport Terminal', is_major = TRUE
WHERE name = 'Nnamdi Azikiwe Airport';

UPDATE bus_stops
SET stop_type = 'Corridor Interchange', is_major = TRUE
WHERE name IN (
  'Karu Bridge', 'Airport Junction', 'Giri Junction', 'Dutse Junction',
  'Mpape Junction', 'Mararaba (Boundary)', 'Kugbo Junction'
);

UPDATE bus_stops
SET stop_type = 'Civil Service Hub', is_major = TRUE
WHERE name IN ('Federal Secretariat', 'Central Business District (CBD)');

UPDATE bus_stops
SET stop_type = 'Corridor Hub', is_major = TRUE
WHERE name IN ('Lugbe (F.H.A.)', 'Mabushi Roundabout', 'Bwari', 'Kuje');

UPDATE bus_stops
SET stop_type = 'District Hub', is_major = FALSE
WHERE name IN (
  'Wuse Zone 6 / Sky Memorial', 'Area 2 (Shopping Complex)',
  'Area 3 Junction', 'Wuse Zone 2', 'Wuse Zone 7', 'Garki Area 7',
  'Asokoro Diplomatic Zone', 'Suburban Hub'
);

UPDATE bus_stops
SET stop_type = 'Estate Stop', is_major = FALSE
WHERE name IN (
  'Sun City', 'Sunny Vale', 'Peace Court Estate', 'Trademore (Lokogoma)',
  'Efab Lokogoma', 'Trade More (Lugbe)', 'Aso Estate',
  'Lugbe Sector F', 'Apo Legislative Quarters', 'Apo Resettlement',
  'Gwarinpa (2nd Avenue)', 'Gwarinpa (3rd Avenue)',
  'Gwarinpa (4th Avenue)', 'Gwarinpa (5th Avenue)',
  'Gwarinpa (69 Road)', 'Kubwa Gate 2'
);

UPDATE bus_stops
SET stop_type = 'Keke / Okada Hub', is_major = FALSE
WHERE name IN (
  'Utako Market Keke Hub', 'Jabi Lake Mall Keke Stop', 'Dawaki Keke Stop',
  'Lugbe Phase 1', 'Lugbe Phase 2', 'VON Junction', 'Kabusa Village',
  'Kubwa Village', 'Jikwoyi Phase 1', 'Karu Phase 2'
);

UPDATE bus_stops
SET stop_type = 'Informal / Village Stop', is_major = FALSE
WHERE name IN (
  'Apo Mechanic Village', 'Kabusa Junction', 'Pyakasa', 'Kapwa',
  'Kubwa (Byazhin)', 'Kubwa (Arab Road)', 'Kubwa (PW)', 'Mpape Village',
  'Jikwoyi', 'Kurudu', 'Karu Site'
);
