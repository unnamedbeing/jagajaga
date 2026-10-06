import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Clock, MessageSquare, Train, Bus, Info, ChevronDown, ChevronUp, ArrowRight, ArrowDownUp, Bike, CarFront, X, LocateFixed, Flag, BookmarkPlus } from 'lucide-react';
import { cn } from '../utils/cn';
import { AnimatePresence, motion } from 'framer-motion';

// Helper to ignore spaces and special characters during search normalization
const normalizeString = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const VERIFIED_ABUJA_TRANSIT = {
  // === CITY CENTER (WUSE, GARKI, MAITAMA, ASOKORO, CBD, UTAKO, JABI) ===
  "Berger Bus Stop": [
    ["Wuse Market", 10, "₦300 - ₦800", "Commercial Bus / Shared Taxi", "Intra-city Link"],
    ["Jabi Park", 10, "₦200 - ₦500", "Keke Napep / Taxi", "Intra-city Hub Link"],
    ["Area 1", 15, "₦75 - ₦900", "AUMTCO Bus / Shared Taxi", "AUMTCO Route / Express"],
    ["Gwarinpa (1st Avenue / Charlie Boy)", 20, "₦600 - ₦900", "Shared Taxi", "Zuba Corridor"],
    ["Kubwa (Phase 4 / Gate 1)", 25, "₦400 - ₦1,200", "Commercial Bus / Taxi", "Kubwa Expressway"],
    ["Nyanya", 30, "₦150 - ₦200", "AUMTCO Bus", "Commuter Route"],
    ["Karu Bridge", 25, "₦800 - ₦1,000", "Commercial Bus / Shared Taxi", "Karu Express Corridor"],
    ["Utako Motor Park", 8, "₦200 - ₦400", "Keke Napep / Taxi", "Interstate Terminal Access"],
    ["Magic Land Axis", 12, "₦200 - ₦400", "Commercial Bus", "Airport Road Direction"],
  ],
  "Wuse Market": [
    ["Berger Bus Stop", 10, "₦300 - ₦800", "Commercial Bus / Taxi", "Intra-city Link"],
    ["Wuse Zone 2", 5, "₦150 - ₦250", "Keke Napep", "Internal Wuse Keke Route"],
    ["Wuse Zone 4 Underbridge", 5, "₦150 - ₦250", "Keke Napep / Shared Taxi", "Inner Wuse Link"],
    ["Wuse Zone 7", 7, "₦200 - ₦300", "Keke Napep", "Internal Wuse Keke Route"],
    ["Area 1", 15, "₦150 - ₦300", "Shared Taxi / Bus", "Central Axis"],
    ["Federal Secretariat", 10, "₦200 - ₦300", "Shared Taxi", "Civil Service Direct"],
    ["Banex", 8, "₦200 - ₦300", "Shared Taxi / Keke", "Wuse 2 Axis"],
    ["Maitama (Nicon Junction)", 12, "₦300 - ₦500", "Shared Taxi", "Maitama Link"],
  ],
  "Wuse Zone 2": [
    ["Wuse Market", 5, "₦150 - ₦250", "Keke Napep", "Direct Keke Link"],
    ["Wuse Zone 7", 4, "₦150 - ₦200", "Keke Napep / Bike (Okada)", "Local Connection"],
  ],
  "Wuse Zone 7": [
    ["Wuse Zone 2", 4, "₦150 - ₦200", "Keke Napep / Bike (Okada)", "Local Connection"],
    ["Wuse Market", 7, "₦200 - ₦300", "Keke Napep", "Market Link"],
  ],
  "Wuse Zone 4 Underbridge": [
    ["Wuse Market", 5, "₦150 - ₦250", "Keke Napep / Taxi", "Wuse Link"],
    ["Federal Secretariat", 8, "₦200 - ₦300", "Shared Taxi", "Central Axis"],
  ],
  "Federal Secretariat": [
    ["Wuse Market", 10, "₦200 - ₦300", "Shared Taxi", "City Center Link"],
    ["A.Y.A (Asokoro)", 8, "₦200 - ₦300", "Shared Taxi", "Asokoro Direct"],
    ["Central Business District (CBD)", 5, "₦150 - ₦200", "Keke Napep / Walk", "Office Zone"],
  ],
  "Central Business District (CBD)": [
    ["Federal Secretariat", 5, "₦150 - ₦200", "Keke Napep / Walk", "Civil Service Direct"],
  ],
  "Utako Motor Park": [
    ["Berger Bus Stop", 8, "₦200 - ₦400", "Keke Napep / Taxi", "Terminal Access"],
    ["Utako Market Keke Hub", 3, "₦100 - ₦150", "Keke Napep", "Inner Utako Link"],
  ],
  "Utako Market Keke Hub": [
    ["Utako Motor Park", 3, "₦100 - ₦150", "Keke Napep", "Motor Park Access"],
    ["Jabi Lake Mall Keke Stop", 5, "₦150 - ₦200", "Keke Napep", "Commercial Hub Access"],
  ],
  "Jabi Park": [
    ["Berger Bus Stop", 10, "₦200 - ₦500", "Keke Napep / Taxi", "Terminal Access"],
    ["Jabi Lake Mall Keke Stop", 4, "₦100 - ₦150", "Keke Napep", "Mall & Lake Access"],
  ],
  "Jabi Lake Mall Keke Stop": [
    ["Jabi Park", 4, "₦100 - ₦150", "Keke Napep", "Park Access"],
    ["Utako Market Keke Hub", 5, "₦150 - ₦200", "Keke Napep", "Market Access"],
  ],

  // === GARKI DISTRICT & INNER ZONES ===
  "Area 1": [
    ["Berger Bus Stop", 15, "₦75 - ₦900", "AUMTCO Bus / Taxi", "Via Mosque"],
    ["Area 2 (Shopping Complex)", 5, "₦150 - ₦200", "Keke Napep", "Garki Local Route"],
    ["Area 3 Junction", 5, "₦100 - ₦200", "Keke Napep / Walk", "Inner Garki"],
    ["Garki Area 7", 7, "₦150 - ₦250", "Keke Napep", "Internal Garki"],
    ["Apo Roundabout", 10, "₦200 - ₦300", "Shared Taxi / Keke", "Southern Axis"],
    ["Galadimawa Roundabout", 12, "₦200 - ₦400", "Shared Taxi / Bus", "Lokogoma Axis"],
    ["Lugbe (F.H.A.)", 20, "₦300 - ₦600", "Commercial Bus / Taxi", "Airport Expressway"],
  ],
  "Area 2 (Shopping Complex)": [
    ["Area 1", 5, "₦150 - ₦200", "Keke Napep", "Direct Keke Link"],
    ["Garki Area 7", 4, "₦150 - ₦200", "Keke Napep / Bike (Okada)", "Local Connection"],
  ],
  "Garki Area 7": [
    ["Area 2 (Shopping Complex)", 4, "₦150 - ₦200", "Keke Napep / Bike (Okada)", "Local Connection"],
    ["Area 1", 7, "₦150 - ₦250", "Keke Napep", "Garki Hub Link"],
  ],
  "Area 3 Junction": [
    ["Area 1", 5, "₦100 - ₦200", "Keke Napep / Walk", "Garki Hub"],
    ["Apo Roundabout", 8, "₦150 - ₦250", "Keke Napep / Taxi", "Apo Axis"],
  ],

  // === SOUTHERN AXIS (APO, GALADIMAWA, LOKOGOMA, SUN CITY, SUNNY VALE) ===
  "Apo Roundabout": [
    ["Area 1", 10, "₦200 - ₦300", "Shared Taxi / Keke", "Garki Link"],
    ["Galadimawa Roundabout", 10, "₦200 - ₦300", "Shared Taxi", "Southern Ring Road"],
    ["Apo Legislative Quarters", 5, "₦100 - ₦200", "Keke Napep / Bike (Okada)", "Quarter Gate Link"],
    ["Apo Mechanic Village", 5, "₦150 - ₦250", "Keke Napep / Bike (Okada)", "Local Route"],
    ["Apo Resettlement", 8, "₦150 - ₦250", "Keke Napep", "Residential Axis"],
  ],
  "Apo Legislative Quarters": [
    ["Apo Roundabout", 5, "₦100 - ₦200", "Keke Napep / Bike (Okada)", "Main Highway Access"],
    ["Apo Resettlement", 5, "₦100 - ₦150", "Bike (Okada) / Keke", "Inner Quarter Shortcut"],
  ],
  "Apo Resettlement": [
    ["Apo Roundabout", 8, "₦150 - ₦250", "Keke Napep", "Apo Hub Access"],
    ["Apo Legislative Quarters", 5, "₦100 - ₦150", "Bike (Okada) / Keke", "Inner Quarter Shortcut"],
  ],
  "Apo Mechanic Village": [
    ["Apo Roundabout", 5, "₦150 - ₦250", "Keke Napep / Bike", "Main Road Access"],
    ["Kabusa Village", 8, "₦150 - ₦250", "Bike (Okada) / Keke", "Village Shortcut"],
    ["Kabusa Junction", 10, "₦200 - ₦300", "Bike (Okada) / Keke", "Informal Village Link"],
  ],
  "Kabusa Village": [
    ["Apo Mechanic Village", 8, "₦150 - ₦250", "Bike (Okada) / Keke", "Mechanic Hub Access"],
    ["Kabusa Junction", 5, "₦100 - ₦150", "Bike (Okada)", "Direct Village Route"],
  ],
  "Kabusa Junction": [
    ["Kabusa Village", 5, "₦100 - ₦150", "Bike (Okada)", "Village Access"],
    ["Lokogoma Junction", 12, "₦300 - ₦400", "Bike (Okada) / Keke", "Cross-District Link"],
  ],
  "Galadimawa Roundabout": [
    ["Area 1", 12, "₦200 - ₦400", "Shared Taxi / Bus", "Garki Link"],
    ["Lokogoma Junction", 5, "₦150 - ₦250", "Keke Napep", "Lokogoma Branch"],
    ["Sun City", 5, "₦100 - ₦200", "Keke Napep / Bike (Okada)", "Direct Estate Link"],
    ["Sunny Vale", 6, "₦100 - ₦200", "Keke Napep / Bike (Okada)", "Direct Estate Link"],
    ["Lugbe (F.H.A.)", 15, "₦300 - ₦500", "Shared Taxi", "Airport Road Link"],
  ],
  "Sun City": [
    ["Galadimawa Roundabout", 5, "₦100 - ₦200", "Keke Napep / Bike (Okada)", "Galadimawa Access"],
    ["Sunny Vale", 3, "₦100 - ₦150", "Bike (Okada) / Keke", "Direct Inter-Estate Link"],
    ["Peace Court Estate", 4, "₦100 - ₦150", "Bike (Okada) / Keke", "Inner Estate Shortcut"],
  ],
  "Sunny Vale": [
    ["Galadimawa Roundabout", 6, "₦100 - ₦200", "Keke Napep / Bike (Okada)", "Galadimawa Access"],
    ["Sun City", 3, "₦100 - ₦150", "Bike (Okada) / Keke", "Direct Inter-Estate Link"],
    ["Peace Court Estate", 4, "₦100 - ₦150", "Bike (Okada) / Keke", "Inner Estate Shortcut"],
  ],
  "Peace Court Estate": [
    ["Sun City", 4, "₦100 - ₦150", "Bike (Okada) / Keke", "Sun City Access"],
    ["Sunny Vale", 4, "₦100 - ₦150", "Bike (Okada) / Keke", "Sunny Vale Access"],
  ],
  "Lokogoma Junction": [
    ["Galadimawa Roundabout", 5, "₦150 - ₦250", "Keke Napep", "Galadimawa Link"],
    ["Trademore (Lokogoma)", 8, "₦150 - ₦250", "Keke Napep / Bike (Okada)", "Estate Deep Access"],
    ["Efab Lokogoma", 6, "₦100 - ₦200", "Keke Napep / Bike (Okada)", "Efab Gate Link"],
  ],
  "Efab Lokogoma": [
    ["Lokogoma Junction", 6, "₦100 - ₦200", "Keke Napep / Bike (Okada)", "Expressway Access"],
    ["Trademore (Lokogoma)", 5, "₦100 - ₦150", "Bike (Okada)", "Backway Estate Route"],
  ],
  "Trademore (Lokogoma)": [
    ["Lokogoma Junction", 8, "₦150 - ₦250", "Keke Napep / Bike (Okada)", "Junction Access"],
    ["Efab Lokogoma", 5, "₦100 - ₦150", "Bike (Okada)", "Inter-Estate Link"],
  ],

  // === AIRPORT ROAD / LUGBE CORRIDOR ===
  "Magic Land Axis": [
    ["Lugbe (F.H.A.)", 12, "₦200 - ₦400", "Commercial Bus / Taxi", "Airport Road Line"],
  ],
  "Lugbe (F.H.A.)": [
    ["Lugbe Phase 1", 3, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Phase 1 Inner Link"],
    ["Lugbe Phase 2", 5, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Internal Lugbe Link"],
    ["Lugbe Police Signboard", 5, "₦100 - ₦200", "Keke Napep", "Local Axis"],
    ["Airport Junction", 10, "₦200 - ₦300", "Commercial Bus", "Airport Road Line"],
    ["Area 1", 20, "₦300 - ₦600", "Commercial Bus / Taxi", "Garki Express"],
  ],
  "Lugbe Phase 1": [
    ["Lugbe (F.H.A.)", 3, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "F.H.A Central Access"],
    ["Lugbe Phase 2", 3, "₦100 - ₦150", "Bike (Okada) / Keke", "Phase 2 Shortcut"],
  ],
  "Lugbe Phase 2": [
    ["Lugbe Phase 1", 3, "₦100 - ₦150", "Bike (Okada) / Keke", "Phase 1 Access"],
    ["Lugbe (F.H.A.)", 5, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "F.H.A Link"],
    ["Lugbe Sector F", 5, "₦100 - ₦150", "Bike (Okada)", "Sector F Route"],
  ],
  "Lugbe Police Signboard": [
    ["Lugbe (F.H.A.)", 5, "₦100 - ₦200", "Keke Napep", "Local Axis"],
    ["Trade More (Lugbe)", 10, "₦200 - ₦300", "Keke Napep / Bike (Okada)", "Lugbe Estate Corridor"],
    ["Airport Junction", 8, "₦150 - ₦250", "Commercial Bus", "Airport Line"],
  ],
  "Trade More (Lugbe)": [
    ["Lugbe Police Signboard", 10, "₦200 - ₦300", "Keke Napep / Bike (Okada)", "Expressway Access"],
    ["VON Junction", 6, "₦150 - ₦200", "Bike (Okada) / Keke", "VON Service Road"],
  ],
  "VON Junction": [
    ["Trade More (Lugbe)", 6, "₦150 - ₦200", "Bike (Okada) / Keke", "Trademore Access"],
  ],
  "Lugbe Sector F": [
    ["Lugbe Phase 2", 5, "₦100 - ₦150", "Bike (Okada)", "Phase 2 Link"],
    ["Pyakasa", 6, "₦150 - ₦200", "Bike (Okada)", "Village Access"],
  ],
  "Pyakasa": [
    ["Lugbe Sector F", 6, "₦150 - ₦200", "Bike (Okada)", "Sector F Access"],
    ["Kapwa", 5, "₦100 - ₦150", "Bike (Okada)", "Village-to-Village Route"],
  ],
  "Kapwa": [
    ["Pyakasa", 5, "₦100 - ₦150", "Bike (Okada)", "Pyakasa Link"],
  ],
  "Airport Junction": [
    ["Lugbe (F.H.A.)", 10, "₦200 - ₦300", "Commercial Bus", "Town Outbound"],
    ["Nnamdi Azikiwe Airport", 15, "₦2,500 - ₦4,000", "Shuttle / Express Taxi", "Airport Direct"],
    ["Giri Junction", 15, "₦300 - ₦500", "Commercial Bus", "Gwagwalada Line"],
  ],

  // === NORTHERN / GWARINPA / DAWAKI / KUBWA ===
  "Banex": [
    ["Wuse Market", 8, "₦200 - ₦300", "Keke Napep / Shared Taxi", "Wuse 2 Axis"],
    ["Mabushi Roundabout", 5, "₦150 - ₦250", "Commercial Bus / Keke", "Expressway Link"],
    ["Maitama (Nicon Junction)", 5, "₦150 - ₦250", "Shared Taxi", "Maitama Axis"],
  ],
  "Mabushi Roundabout": [
    ["Banex", 5, "₦150 - ₦250", "Commercial Bus / Keke", "Wuse Axis"],
    ["Jahi Junction", 5, "₦150 - ₦250", "Commercial Bus", "Kubwa Express"],
  ],
  "Jahi Junction": [
    ["Mabushi Roundabout", 5, "₦150 - ₦250", "Commercial Bus", "Inbound Town"],
    ["Katampe", 5, "₦150 - ₦250", "Commercial Bus", "Kubwa Express"],
  ],
  "Katampe": [
    ["Jahi Junction", 5, "₦150 - ₦250", "Commercial Bus", "Inbound Town"],
    ["Gwarinpa (1st Avenue / Charlie Boy)", 8, "₦200 - ₦300", "Commercial Bus / Taxi", "Suburban Line"],
  ],
  "Gwarinpa (1st Avenue / Charlie Boy)": [
    ["Berger Bus Stop", 20, "₦600 - ₦900", "Shared Taxi", "City Center Direct"],
    ["Gwarinpa (2nd Avenue)", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Internal Gwarinpa Grid"],
    ["Gwarinpa (3rd Avenue)", 6, "₦100 - ₦150", "Keke Napep", "Internal Gwarinpa Grid"],
    ["Gwarinpa (4th Avenue)", 8, "₦150 - ₦200", "Keke Napep", "Internal Gwarinpa Grid"],
    ["Dutse Junction", 10, "₦200 - ₦300", "Commercial Bus", "Kubwa Express"],
  ],
  "Gwarinpa (2nd Avenue)": [
    ["Gwarinpa (1st Avenue / Charlie Boy)", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Grid Link"],
    ["Gwarinpa (3rd Avenue)", 3, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Grid Link"],
  ],
  "Gwarinpa (3rd Avenue)": [
    ["Gwarinpa (2nd Avenue)", 3, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Grid Link"],
    ["Gwarinpa (4th Avenue)", 3, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Grid Link"],
    ["Gwarinpa (5th Avenue)", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Estate Inner Loop"],
    ["Gwarinpa (Chemist Junction)", 5, "₦100 - ₦150", "Keke Napep", "Internal Gwarinpa"],
  ],
  "Gwarinpa (4th Avenue)": [
    ["Gwarinpa (1st Avenue / Charlie Boy)", 8, "₦150 - ₦200", "Keke Napep", "Grid Link"],
    ["Gwarinpa (3rd Avenue)", 3, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Grid Link"],
    ["Gwarinpa (5th Avenue)", 3, "₦100 - ₦150", "Bike (Okada) / Keke", "Estate Inner Loop"],
  ],
  "Gwarinpa (5th Avenue)": [
    ["Gwarinpa (3rd Avenue)", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Inner Loop"],
    ["Gwarinpa (4th Avenue)", 3, "₦100 - ₦150", "Bike (Okada) / Keke", "Inner Loop"],
    ["Dawaki Keke Stop", 5, "₦150 - ₦200", "Bike (Okada) / Keke", "Estate Bypass Link"],
  ],
  "Dawaki Keke Stop": [
    ["Gwarinpa (5th Avenue)", 5, "₦150 - ₦200", "Bike (Okada) / Keke", "Gwarinpa Bypass"],
    ["Dutse Junction", 5, "₦150 - ₦200", "Bike (Okada) / Keke", "Dutse Link"],
  ],
  "Gwarinpa (Chemist Junction)": [
    ["Gwarinpa (3rd Avenue)", 5, "₦100 - ₦150", "Keke Napep", "Internal Gwarinpa"],
    ["Gwarinpa (69 Road)", 6, "₦150 - ₦200", "Bike (Okada) / Keke", "Deep Estate"],
  ],
  "Gwarinpa (69 Road)": [
    ["Gwarinpa (Chemist Junction)", 6, "₦150 - ₦200", "Bike (Okada) / Keke", "Deep Estate"],
  ],
  "Dutse Junction": [
    ["Gwarinpa (1st Avenue / Charlie Boy)", 10, "₦200 - ₦300", "Commercial Bus", "Town Direct"],
    ["Dawaki Keke Stop", 5, "₦150 - ₦200", "Bike (Okada) / Keke", "Dawaki Gate Link"],
    ["Public Service Institute", 5, "₦150 - ₦200", "Commercial Bus", "Kubwa Line"],
  ],
  "Public Service Institute": [
    ["Kubwa (Phase 4 / Gate 1)", 8, "₦200 - ₦300", "Commercial Bus / Keke", "Kubwa Line"],
  ],
  "Kubwa (Phase 4 / Gate 1)": [
    ["Berger Bus Stop", 25, "₦400 - ₦1,200", "Commercial Bus / Taxi", "Town Express"],
    ["Kubwa Gate 2", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Kubwa Inner Ring"],
    ["Kubwa (PW)", 8, "₦150 - ₦200", "Keke Napep", "Inner Kubwa"],
    ["Dei-Dei", 12, "₦200 - ₦300", "Commercial Bus", "Outer Line"],
  ],
  "Kubwa Gate 2": [
    ["Kubwa (Phase 4 / Gate 1)", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Gate 1 Link"],
    ["Kubwa Village", 5, "₦100 - ₦150", "Bike (Okada) / Keke", "Village Route"],
  ],
  "Kubwa Village": [
    ["Kubwa Gate 2", 5, "₦100 - ₦150", "Bike (Okada) / Keke", "Gate 2 Access"],
    ["Kubwa (PW)", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "PW Hub Link"],
  ],
  "Kubwa (PW)": [
    ["Kubwa Village", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Village Link"],
    ["Kubwa (Phase 4 / Gate 1)", 8, "₦150 - ₦200", "Keke Napep", "Highway Access"],
    ["Kubwa (Byazhin)", 6, "₦150 - ₦200", "Bike (Okada) / Keke", "Suburban Deep Access"],
    ["Kubwa (Arab Road)", 6, "₦150 - ₦200", "Bike (Okada) / Keke", "Arab Road Link"],
  ],
  "Kubwa (Byazhin)": [
    ["Kubwa (PW)", 6, "₦150 - ₦200", "Bike (Okada) / Keke", "Kubwa Hub Access"],
    ["Kubwa (Arab Road)", 4, "₦100 - ₦150", "Bike (Okada)", "Byazhin-Arab Shortcut"],
  ],
  "Kubwa (Arab Road)": [
    ["Kubwa (PW)", 6, "₦150 - ₦200", "Bike (Okada) / Keke", "Kubwa Hub Access"],
    ["Kubwa (Byazhin)", 4, "₦100 - ₦150", "Bike (Okada)", "Byazhin Shortcut"],
  ],
  "Dei-Dei": [
    ["Kubwa (Phase 4 / Gate 1)", 12, "₦200 - ₦300", "Commercial Bus", "Suburban Line"],
    ["Zuba", 12, "₦200 - ₦400", "Commercial Bus", "Outer Highway"],
  ],
  "Zuba": [
    ["Dei-Dei", 12, "₦200 - ₦400", "Commercial Bus", "Suburban Line"],
  ],

  // === NYANYA, KARU, JIKWOYI, KURUDU AXIS ===
  "A.Y.A (Asokoro)": [
    ["Area 1", 12, "₦200 - ₦400", "Shared Taxi / Bus", "Inner Ring Link"],
    ["Asokoro Diplomatic Zone", 5, "₦150 - ₦250", "Keke Napep / Taxi", "Diplomatic Zone Access"],
    ["Kugbo Junction", 10, "₦200 - ₦300", "Commercial Bus / Taxi", "Nyanya Axis"],
    ["Karu Bridge", 12, "₦500 - ₦700", "Commercial Bus / Shared Taxi", "Karu Expressway"],
  ],
  "Asokoro Diplomatic Zone": [
    ["A.Y.A (Asokoro)", 5, "₦150 - ₦250", "Keke Napep / Taxi", "A.Y.A Link"],
  ],
  "Kugbo Junction": [
    ["A.Y.A (Asokoro)", 10, "₦200 - ₦300", "Commercial Bus / Taxi", "Asokoro Link"],
    ["Nyanya", 10, "₦200 - ₦300", "Commercial Bus / Taxi", "Nyanya Line"],
  ],
  "Karu Bridge": [
    ["A.Y.A (Asokoro)", 12, "₦500 - ₦700", "Commercial Bus / Shared Taxi", "Inbound Asokoro"],
    ["Wuse Market", 25, "₦800 - ₦1,000", "Commercial Bus / Shared Taxi", "Inbound Wuse Direct"],
    ["Berger Bus Stop", 25, "₦800 - ₦1,000", "Commercial Bus / Shared Taxi", "Inbound Berger Direct"],
    ["Karu Site", 8, "₦150 - ₦250", "Keke Napep / Taxi", "Internal Karu"],
    ["Nyanya", 8, "₦150 - ₦250", "Commercial Bus / Keke", "Outbound Nyanya Line"],
  ],
  "Karu Site": [
    ["Karu Bridge", 8, "₦150 - ₦250", "Keke Napep / Taxi", "Expressway Access"],
    ["Karu Phase 2", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Inner Karu Link"],
    ["Jikwoyi", 12, "₦200 - ₦300", "Bike (Okada) / Keke", "Deep Eastern Suburb"],
  ],
  "Karu Phase 2": [
    ["Karu Site", 4, "₦100 - ₦150", "Keke Napep / Bike (Okada)", "Karu Site Access"],
    ["Jikwoyi Phase 1", 5, "₦150 - ₦200", "Bike (Okada) / Keke", "Suburban Shortcut"],
  ],
  "Jikwoyi": [
    ["Karu Site", 12, "₦200 - ₦300", "Bike (Okada) / Keke", "Karu Route"],
    ["Jikwoyi Phase 1", 3, "₦100 - ₦150", "Bike (Okada) / Keke", "Local Phase Link"],
    ["Kurudu", 12, "₦200 - ₦300", "Bike (Okada) / Keke", "Deep Eastern Suburb"],
  ],
  "Jikwoyi Phase 1": [
    ["Karu Phase 2", 5, "₦150 - ₦200", "Bike (Okada) / Keke", "Karu Shortcut"],
    ["Jikwoyi", 3, "₦100 - ₦150", "Bike (Okada) / Keke", "Jikwoyi Hub Link"],
  ],
  "Kurudu": [
    ["Jikwoyi", 12, "₦200 - ₦300", "Bike (Okada) / Keke", "City Bound Route"],
  ],
  "Nyanya": [
    ["Kugbo Junction", 10, "₦200 - ₦300", "Commercial Bus", "Asokoro Line"],
    ["Karu Bridge", 8, "₦150 - ₦250", "Commercial Bus / Keke", "Inbound Karu Axis"],
    ["Mararaba (Boundary)", 8, "₦150 - ₦250", "Keke Napep / Commercial Bus", "State Border Link"],
    ["Berger Bus Stop", 30, "₦150 - ₦200", "AUMTCO Bus", "AUMTCO Mass Transit"],
  ],
  "Mararaba (Boundary)": [
    ["Nyanya", 8, "₦150 - ₦250", "Keke Napep / Commercial Bus", "Nyanya Link"],
  ],

  // === MPAPE, BWARI & OUTSKIRTS ===
  "Mpape Junction": [
    ["Wuse Market", 20, "₦150 - ₦200", "AUMTCO Bus", "Suburban Line"],
    ["Mpape Village", 12, "₦150 - ₦250", "Bike (Okada) / Keke", "Deep Mpape Access"],
  ],
  "Mpape Village": [
    ["Mpape Junction", 12, "₦150 - ₦250", "Bike (Okada) / Keke", "Highway Link"],
  ],
  "Bwari": [
    ["Wuse Market", 45, "₦200 - ₦250", "AUMTCO Bus", "Outer District Line"],
  ],
  "Giri Junction": [
    ["Airport Junction", 15, "₦300 - ₦500", "Commercial Bus", "Airport Expressway Link"],
    ["Gwagwalada", 15, "₦300 - ₦500", "Commercial Bus", "Gwagwalada Main"],
  ],
  "Gwagwalada": [
    ["Giri Junction", 15, "₦300 - ₦500", "Commercial Bus", "Outer Link"],
  ],
  "Kuje": [
    ["Lugbe (F.H.A.)", 20, "₦300 - ₦500", "Commercial Bus", "Kuje Expressway"],
  ]
};

const LOCATION_METADATA = {
  "Berger Bus Stop": { coords: [9.0765, 7.4772], type: "Major Interchange" },
  "Wuse Market": { coords: [9.0655, 7.4756], type: "Major Interchange" },
  "Wuse Zone 2": { coords: [9.0610, 7.4810], type: "Local District Hub" },
  "Wuse Zone 7": { coords: [9.0700, 7.4850], type: "Local District Hub" },
  "Wuse Zone 4 Underbridge": { coords: [9.0637, 7.4749], type: "Commercial Bus Stop" },
  "Area 1": { coords: [9.0328, 7.4901], type: "Major Interchange" },
  "Area 2 (Shopping Complex)": { coords: [9.0360, 7.4850], type: "District Hub" },
  "Garki Area 7": { coords: [9.0410, 7.4910], type: "Local District Hub" },
  "Area 3 Junction": { coords: [9.0385, 7.4880], type: "District Bus Stop" },
  "Federal Secretariat": { coords: [9.0533, 7.5022], type: "Civil Service Hub" },
  "Central Business District (CBD)": { coords: [9.0583, 7.4894], type: "Business Hub" },
  "Banex": { coords: [9.0811, 7.4833], type: "Major Interchange" },
  "Maitama (Nicon Junction)": { coords: [9.0889, 7.5000], type: "Major Interchange" },
  "A.Y.A (Asokoro)": { coords: [9.0553, 7.5256], type: "Major Interchange" },
  "Asokoro Diplomatic Zone": { coords: [9.0490, 7.5310], type: "District Hub" },
  "Mabushi Roundabout": { coords: [9.0802, 7.4641], type: "Corridor Stop" },
  "Utako Motor Park": { coords: [9.0743, 7.4475], type: "Interstate Terminal" },
  "Utako Market Keke Hub": { coords: [9.0720, 7.4510], type: "Keke / Okada Hub" },
  "Jabi Park": { coords: [9.0712, 7.4285], type: "Interstate / Local Terminal" },
  "Jabi Lake Mall Keke Stop": { coords: [9.0780, 7.4320], type: "Keke / Okada Hub" },
  "Apo Roundabout": { coords: [9.0068, 7.5050], type: "Southern Interchange" },
  "Apo Legislative Quarters": { coords: [9.0120, 7.5120], type: "Inner Estate Stop" },
  "Apo Mechanic Village": { coords: [8.9950, 7.5000], type: "Informal / Local Stop" },
  "Apo Resettlement": { coords: [8.9850, 7.5100], type: "Suburban Hub" },
  "Kabusa Village": { coords: [8.9710, 7.4900], type: "Keke / Okada Hub" },
  "Kabusa Junction": { coords: [8.9750, 7.4950], type: "Informal Hub" },
  "Galadimawa Roundabout": { coords: [8.9950, 7.4430], type: "Southern Transit Hub" },
  "Lokogoma Junction": { coords: [8.9780, 7.4420], type: "Suburban Hub" },
  "Efab Lokogoma": { coords: [8.9710, 7.4380], type: "Inner Estate Stop" },
  "Sun City": { coords: [8.9850, 7.4500], type: "Estate Stop" },
  "Sunny Vale": { coords: [8.9820, 7.4530], type: "Estate Stop" },
  "Peace Court Estate": { coords: [8.9800, 7.4510], type: "Inner Estate Stop" },
  "Trademore (Lokogoma)": { coords: [8.9650, 7.4400], type: "Estate Stop" },
  "Magic Land Axis": { coords: [9.0278, 7.4350], type: "Outbound Highway Stop" },
  "Lugbe (F.H.A.)": { coords: [8.9667, 7.3833], type: "Corridor Hub" },
  "Lugbe Phase 1": { coords: [8.9650, 7.3810], type: "Keke / Okada Hub" },
  "Lugbe Phase 2": { coords: [8.9630, 7.3790], type: "Local Estate Stop" },
  "Lugbe Police Signboard": { coords: [8.9600, 7.3750], type: "Highway Bus Stop" },
  "Trade More (Lugbe)": { coords: [8.9400, 7.3500], type: "Estate Hub" },
  "VON Junction": { coords: [8.9350, 7.3450], type: "Keke / Okada Hub" },
  "Lugbe Sector F": { coords: [8.9550, 7.3700], type: "Local Estate Stop" },
  "Pyakasa": { coords: [8.9500, 7.3650], type: "Informal Village Stop" },
  "Kapwa": { coords: [8.9450, 7.3600], type: "Informal Village Stop" },
  "Airport Junction": { coords: [9.0200, 7.3800], type: "Corridor Stop" },
  "Nnamdi Azikiwe Airport": { coords: [9.0067, 7.2631], type: "Airport Terminal" },
  "Jahi Junction": { coords: [9.0833, 7.4417], type: "Highway Bus Stop" },
  "Katampe": { coords: [9.1000, 7.4500], type: "Corridor Stop" },
  "Gwarinpa (1st Avenue / Charlie Boy)": { coords: [9.1033, 7.4167], type: "Residential Transit Hub" },
  "Gwarinpa (2nd Avenue)": { coords: [9.1060, 7.4130], type: "Local Estate Stop" },
  "Gwarinpa (3rd Avenue)": { coords: [9.1100, 7.4100], type: "Local Stop" },
  "Gwarinpa (4th Avenue)": { coords: [9.1130, 7.4080], type: "Local Estate Stop" },
  "Gwarinpa (5th Avenue)": { coords: [9.1170, 7.4040], type: "Inner Estate Stop" },
  "Dawaki Keke Stop": { coords: [9.1250, 7.3980], type: "Keke / Okada Hub" },
  "Gwarinpa (Chemist Junction)": { coords: [9.1150, 7.4050], type: "Local Stop" },
  "Gwarinpa (69 Road)": { coords: [9.1200, 7.4000], type: "Local Estate Stop" },
  "Dutse Junction": { coords: [9.1417, 7.3861], type: "Suburban Junction" },
  "Public Service Institute": { coords: [9.1480, 7.3620], type: "Corridor Stop" },
  "Kubwa (Phase 4 / Gate 1)": { coords: [9.1578, 7.3392], type: "Suburban Hub" },
  "Kubwa Gate 2": { coords: [9.1610, 7.3340], type: "Inner Estate Stop" },
  "Kubwa Village": { coords: [9.1630, 7.3310], type: "Keke / Okada Hub" },
  "Kubwa (PW)": { coords: [9.1650, 7.3300], type: "Local District Hub" },
  "Kubwa (Byazhin)": { coords: [9.1700, 7.3200], type: "Informal Stop" },
  "Kubwa (Arab Road)": { coords: [9.1600, 7.3100], type: "Informal Stop" },
  "Dei-Dei": { coords: [9.1667, 7.3000], type: "Corridor Stop" },
  "Zuba": { coords: [9.1667, 7.1500], type: "Major Outer Interchange" },
  "Mpape Junction": { coords: [9.1333, 7.5333], type: "Suburban Hub" },
  "Mpape Village": { coords: [9.1400, 7.5400], type: "Informal Stop" },
  "Kugbo Junction": { coords: [9.0233, 7.5450], type: "Corridor Stop" },
  "Karu Bridge": { coords: [9.0083, 7.5583], type: "Corridor Interchange" },
  "Karu Site": { coords: [9.0000, 7.5700], type: "Suburban Hub" },
  "Karu Phase 2": { coords: [8.9910, 7.5800], type: "Inner Estate Stop" },
  "Jikwoyi": { coords: [8.9800, 7.5900], type: "Informal / Suburban Stop" },
  "Jikwoyi Phase 1": { coords: [8.9750, 7.6000], type: "Keke / Okada Hub" },
  "Kurudu": { coords: [8.9700, 7.6100], type: "Suburban Stop" },
  "Nyanya": { coords: [8.9833, 7.5667], type: "Major Outer Interchange" },
  "Mararaba (Boundary)": { coords: [8.9750, 7.5833], type: "Border Interchange" },
  "Bwari": { coords: [9.2833, 7.3833], type: "Outer Suburban Hub" },
  "Giri Junction": { coords: [8.9500, 7.2333], type: "Southern Outer Junction" },
  "Gwagwalada": { coords: [8.9500, 7.0833], type: "Outer City Hub" },
  "Kuje": { coords: [8.8783, 7.2342], type: "Outer Suburban Hub" },
};

const TRANSIT_LOCATIONS = Object.keys(VERIFIED_ABUJA_TRANSIT).sort();

const buildRouteCoordinates = (result) => {
  if (!result || result.error || !Array.isArray(result.path)) {
    return [];
  }

  const coordinates = [];

  for (const step of result.path) {
    const fromCoords = LOCATION_METADATA[step.from]?.coords;
    const toCoords = LOCATION_METADATA[step.to]?.coords;

    if (fromCoords) {
      coordinates.push([fromCoords[1], fromCoords[0]]);
    }

    if (toCoords) {
      coordinates.push([toCoords[1], toCoords[0]]);
    }
  }

  return coordinates;
};

const formatRouteResult = (start, destination) => {
  if (!start || !destination || start === destination) {
    return { error: 'Choose two different locations to build a route.' };
  }

  if (!VERIFIED_ABUJA_TRANSIT[start] || !VERIFIED_ABUJA_TRANSIT[destination]) {
    return { error: 'This location is not part of the verified Abuja transit map yet.' };
  }

  const queue = [{ node: start, totalTime: 0, path: [] }];
  const visited = new Set();

  while (queue.length) {
    queue.sort((a, b) => a.totalTime - b.totalTime);
    const current = queue.shift();

    if (!current || visited.has(current.node)) {
      continue;
    }

    visited.add(current.node);

    if (current.node === destination) {
      return {
        totalTime: current.totalTime,
        path: current.path,
      };
    }

    const nextStops = VERIFIED_ABUJA_TRANSIT[current.node] ?? [];

    for (const [neighbor, timeCost, fareRange, mode, note] of nextStops) {
      if (visited.has(neighbor)) {
        continue;
      }

      queue.push({
        node: neighbor,
        totalTime: current.totalTime + timeCost,
        path: [
          ...current.path,
          {
            from: current.node,
            to: neighbor,
            minutes: timeCost,
            fare: fareRange,
            mode,
            note,
          },
        ],
      });
    }
  }

  return { error: 'No connected route is mapped between those locations.' };
};

const RouteSearch = ({ onRouteChange, onDestinationQueryChange, onUseLocation, onClearLocation, currentLocation, onSaveTrip, onSavePlace, onReport, isSignedIn }) => {
  const [origin, setOrigin] = useState('Sun City');
  const [destination, setDestination] = useState('Sunny Vale');
  const [showRoutes, setShowRoutes] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [originSuggestionsOpen, setOriginSuggestionsOpen] = useState(false);
  const [destinationSuggestionsOpen, setDestinationSuggestionsOpen] = useState(false);
  const [routeResult, setRouteResult] = useState(() => formatRouteResult('Sun City', 'Sunny Vale'));
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);

  useEffect(() => {
    if (currentLocation) {
      setOrigin('Your location');
      setOriginSuggestionsOpen(false);
    } else if (origin === 'Your location') {
      setOrigin('');
    }
  }, [currentLocation]);

  useEffect(() => {
    onRouteChange?.(buildRouteCoordinates(routeResult));
  }, [routeResult, onRouteChange]);

  const originSuggestions = useMemo(() => {
    const query = normalizeString(origin);
    
    if (!query) {
      return TRANSIT_LOCATIONS.slice(0, 8);
    }

    return TRANSIT_LOCATIONS.filter((location) =>
      normalizeString(location).includes(query),
    ).slice(0, 8);
  }, [origin]);

  const destinationSuggestions = useMemo(() => {
    const query = normalizeString(destination);

    if (!query) {
      return TRANSIT_LOCATIONS.slice(0, 8);
    }

    return TRANSIT_LOCATIONS.filter((location) =>
      normalizeString(location).includes(query),
    ).slice(0, 8);
  }, [destination]);

  const routeSummary = useMemo(() => {
    if (routeResult?.error) {
      return routeResult.error;
    }

    return routeResult?.path?.length
      ? `${routeResult.path.length} leg route • ${routeResult.totalTime} mins`
      : 'No route selected';
  }, [routeResult]);

  const handleFindRoutes = () => {
    const matchLocation = (input) => {
        const normalized = normalizeString(input);
        return TRANSIT_LOCATIONS.find(loc => normalizeString(loc) === normalized) || input.trim();
    };

    const validOrigin = matchLocation(origin);
    const validDest = matchLocation(destination);

    const result = formatRouteResult(validOrigin, validDest);
    const isSpecificLocation = !TRANSIT_LOCATIONS.some((location) => normalizeString(location) === normalizeString(validDest));
    const nextResult = isSpecificLocation
      ? { building: true, path: [], totalTime: null }
      : result;

    setOrigin(validOrigin); 
    setDestination(validDest); 
    setShowRoutes(true);
    setIsMinimized(false);
    setRouteResult(nextResult);
    onDestinationQueryChange?.(isSpecificLocation ? validDest : '');
    onRouteChange?.(buildRouteCoordinates(nextResult));
  };

  const handleSwapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
    setOriginSuggestionsOpen(false);
    setDestinationSuggestionsOpen(false);
  };

  const handleAddDirections = async () => {
    await onSaveTrip?.({
      origin,
      destination,
      routeData: { path: routeResult.path || [], currentLocation },
    });
  };

  const handlePointerDown = (event) => {
    dragStartY.current = event.clientY;
    dragCurrentY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (event.buttons === 0) {
      return;
    }

    dragCurrentY.current = event.clientY;
  };

  const handlePointerUp = () => {
    const delta = dragCurrentY.current - dragStartY.current;

    if (delta > 80) {
      setIsMinimized(true);
    } else if (delta < -80) {
      setIsMinimized(false);
      setShowRoutes(true);
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        'bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full flex flex-col overflow-hidden',
        showRoutes ? 'h-[70vh]' : 'h-auto',
      )}
      animate={{ maxHeight: isMinimized ? 140 : 1200 }}
      transition={{ layout: { type: 'spring', stiffness: 280, damping: 30 }, maxHeight: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div
        className="p-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <button
          type="button"
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
              return;
            }
            setIsMinimized(true);
          }}
          className="group flex h-5 w-20 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D1A36]"
          aria-label={isMinimized ? 'Expand route search' : 'Minimize route search'}
        >
          <span className="h-1.5 w-12 rounded-full bg-zinc-200 transition-colors group-hover:bg-[#6D1A36]" />
          {isMinimized ? <ChevronUp size={14} className="ml-1 text-zinc-400" /> : <ChevronDown size={14} className="ml-1 text-zinc-400" />}
        </button>
      </div>

      <div className="px-6 py-4 flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
        {!showRoutes && !isMinimized && (
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900">Where to next?</h2>
            <p className="text-zinc-500 text-sm">Verified Abuja public transit routes, bikes & kekes.</p>
          </div>
        )}

        <AnimatePresence initial={false} mode="wait">
        {isMinimized ? (
          <motion.div
            key="minimized"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-3 pb-2"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Transit</div>
              <div className="font-bold text-zinc-900 text-sm">{origin} → {destination}</div>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="px-3 py-1.5 rounded-xl bg-[#6D1A36] text-[#FCD0A1] text-xs font-bold"
            >
              Expand
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="relative space-y-3">
              <div className="relative">
                <div className="pointer-events-none absolute left-10 top-1.5 z-10 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">From</div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                </div>
                <input
                  type="text"
                  value={origin}
                  readOnly={Boolean(currentLocation)}
                  disabled={Boolean(currentLocation)}
                  onFocus={() => setOriginSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setOriginSuggestionsOpen(false), 120)}
                  onChange={(event) => {
                    setOrigin(event.target.value);
                    setOriginSuggestionsOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleFindRoutes();
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Starting point"
                  className={cn(
                    'w-full pl-10 pr-11 pt-5 pb-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6D1A36] transition-all text-sm font-medium',
                    currentLocation && 'cursor-not-allowed bg-blue-50/60 text-blue-900',
                  )}
                />
                {origin && !currentLocation && <button type="button" onClick={() => setOrigin('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700" aria-label="Clear starting point"><X size={15} /></button>}
                {originSuggestionsOpen && !currentLocation && originSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-zinc-100 bg-white shadow-xl overflow-hidden">
                    {originSuggestions.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setOrigin(location);
                          setOriginSuggestionsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-[#FCD0A1]/20 transition-colors"
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
                <div className="absolute left-[21px] top-[70%] w-[1px] h-10 bg-zinc-100" />
              </div>
              <button
                type="button"
                onClick={currentLocation ? onClearLocation : onUseLocation}
                className="flex items-center gap-2 text-xs font-bold text-[#6D1A36] hover:text-zinc-900"
              >
                {currentLocation ? <X size={14} /> : <LocateFixed size={14} />}
                {currentLocation ? 'Stop using my location' : 'Use my current location'}
              </button>

              <div className="relative">
                <div className="pointer-events-none absolute left-10 top-1.5 z-10 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">To</div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <MapPin size={18} className="text-[#6D1A36]" />
                </div>
                <input
                  type="text"
                  value={destination}
                  onFocus={() => setDestinationSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setDestinationSuggestionsOpen(false), 120)}
                  onChange={(event) => {
                    setDestination(event.target.value);
                    setDestinationSuggestionsOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleFindRoutes();
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Where are you heading?"
                  className="w-full pl-10 pr-11 pt-5 pb-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6D1A36] transition-all text-sm font-medium"
                />
                {destination && <button type="button" onClick={() => setDestination('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700" aria-label="Clear destination"><X size={15} /></button>}
                {destinationSuggestionsOpen && destinationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-zinc-100 bg-white shadow-xl overflow-hidden">
                    {destinationSuggestions.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setDestination(location);
                          setDestinationSuggestionsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-[#FCD0A1]/20 transition-colors"
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSwapLocations}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2 text-[#6D1A36] shadow-sm transition-transform hover:rotate-180 hover:border-[#6D1A36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D1A36]"
                aria-label="Swap starting point and destination"
              >
                <ArrowDownUp size={15} />
              </button>
            </div>

            <AnimatePresence initial={false} mode="wait">
            {!showRoutes ? (
              <motion.button
                key="find"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                onClick={handleFindRoutes}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg shadow-zinc-200 active:scale-[0.98] mb-4"
              >
                Find Best Routes
              </motion.button>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-zinc-800">Verified route</h3>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">{routeSummary}</div>
                  </div>
                  <button
                    onClick={() => setShowRoutes(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-600"
                    aria-label="Hide routes"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>

                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddDirections}
                    disabled={!isSignedIn}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6D1A36] px-3 py-2 text-xs font-bold text-[#FCD0A1] disabled:cursor-not-allowed disabled:opacity-50"
                    title={isSignedIn ? 'Save this trip to Transit History' : 'Sign in to add directions'}
                  >
                    <ArrowRight size={14} /> Add Directions
                  </button>
                  <button
                    type="button"
                    onClick={() => onSavePlace?.({ label: destination, address: destination })}
                    disabled={!isSignedIn}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title={isSignedIn ? 'Save this place' : 'Sign in to save places'}
                  >
                    <BookmarkPlus size={14} /> Save
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 pb-20 scrollbar-hide">
                  {routeResult?.building ? (
                    <div className="rounded-2xl border border-[#FCD0A1] bg-[#FFF7F0] p-4 text-sm text-zinc-700">
                      <div className="font-bold text-zinc-900">Specific location</div>
                      <p className="mt-2 leading-relaxed">From the nearest bus stop, you can walk or get a bike to your specific location.</p>
                      <div className="mt-3 text-xs font-semibold text-[#6D1A36]">Mapbox is finding the building and closest stop on the map.</div>
                    </div>
                  ) : routeResult?.error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                      {routeResult.error}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[#FCD0A1] bg-[#FFF7F0] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6D1A36]">Route</div>
                            <div className="font-bold text-zinc-900 mt-1">{origin} <ArrowRight className="inline-block mx-1" size={14} /> {destination}</div>
                          </div>
                          <div className="bg-[#6D1A36] text-[#FCD0A1] px-2 py-1 rounded-lg text-xs font-bold">
                            ~{routeResult.totalTime} min
                          </div>
                        </div>
                      </div>
                      {routeResult.path.map((step, index) => {
                        const modeLower = step.mode.toLowerCase();
                        let ModeIcon = Train;
                        if (modeLower.includes('bus')) ModeIcon = Bus;
                        else if (modeLower.includes('bike') || modeLower.includes('okada')) ModeIcon = Bike;
                        else if (modeLower.includes('keke') || modeLower.includes('taxi')) ModeIcon = CarFront;

                        return (
                          <div
                            key={`${step.from}-${step.to}-${index}`}
                            className="group border border-zinc-100 rounded-2xl p-4 hover:border-[#6D1A36]/20 hover:bg-[#6D1A36]/5 transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex gap-3">
                                <div className="p-2.5 rounded-xl text-white shadow-sm bg-[#6D1A36]">
                                  <ModeIcon size={20} />
                                </div>
                                <div>
                                  <div className="font-bold text-zinc-900 leading-tight">{step.from} → {step.to}</div>
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {step.minutes} min</span>
                                    <span>•</span>
                                    <span>{step.fare}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-[9px] font-bold uppercase text-zinc-500">Leg {index + 1}</div>
                            </div>

                            <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-100 flex gap-3">
                              <div className="mt-0.5"><MessageSquare size={14} className="text-[#6D1A36]" /></div>
                              <div className="text-xs text-zinc-600 leading-relaxed">
                                <span className="font-semibold text-zinc-800">{step.mode}</span>
                                <span className="mx-1 text-zinc-400">•</span>
                                {step.note}
                                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                                  GPS: ({LOCATION_METADATA[step.to]?.coords?.[0]?.toFixed(4) ?? '—'}, {LOCATION_METADATA[step.to]?.coords?.[1]?.toFixed(4) ?? '—'})
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onReport?.({ reportType: 'route_issue', locationName: step.to, message: `Reported route leg: ${step.from} to ${step.to}` })}
                              disabled={!isSignedIn}
                              className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title={isSignedIn ? 'Report an issue with this route leg' : 'Sign in to report an issue'}
                            >
                              <Flag size={12} /> Report
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <Info size={14} className="shrink-0" />
                    <span>Fares are indicative and can vary with peak/off-peak traffic.</span>
                  </div>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RouteSearch;