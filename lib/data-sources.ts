// Chicago Data Portal Dataset IDs
export const DATASETS = {
  // === BUILDING & PROPERTY ===
  buildingViolations: '22u3-xenr',        // Building violations
  buildingPermits: 'ydr8-5enu',           // Building permits
  
  // === 311 SERVICE REQUESTS ===
  sr311: 'v6vf-nfxy',                     // 311 service requests
  
  // === CRIME ===
  crimes: 'ijzp-q8t2',                    // Crime data (current year - present)
  
  // === BUSINESS & LANDLORDS ===
  businessLicenses: 'r5kz-chrr',          // Business licenses
  problemLandlords: 'n5zj-r44u',          // Problem landlord list
  
  // === HOUSING ===
  affordableHousing: 's6ha-ppgi',         // Affordable rental housing
  
  // === INSPECTIONS ===
  foodInspections: '4ijn-s7e5',           // Food establishment inspections
} as const

// Chicago community areas
export const COMMUNITY_AREAS: Record<string, string> = {
  '1': 'Rogers Park', '2': 'West Ridge', '3': 'Uptown', '4': 'Lincoln Square',
  '5': 'North Center', '6': 'Lake View', '7': 'Lincoln Park', '8': 'Near North Side',
  '9': 'Edison Park', '10': 'Norwood Park', '11': 'Jefferson Park', '12': 'Forest Glen',
  '13': 'North Park', '14': 'Albany Park', '15': 'Portage Park', '16': 'Irving Park',
  '17': 'Dunning', '18': 'Montclare', '19': 'Belmont Cragin', '20': 'Hermosa',
  '21': 'Avondale', '22': 'Logan Square', '23': 'Humboldt Park', '24': 'West Town',
  '25': 'Austin', '26': 'West Garfield Park', '27': 'East Garfield Park', '28': 'Near West Side',
  '29': 'North Lawndale', '30': 'South Lawndale', '31': 'Lower West Side', '32': 'Loop',
  '33': 'Near South Side', '34': 'Armour Square', '35': 'Douglas', '36': 'Oakland',
  '37': 'Fuller Park', '38': 'Grand Boulevard', '39': 'Kenwood', '40': 'Washington Park',
  '41': 'Hyde Park', '42': 'Woodlawn', '43': 'South Shore', '44': 'Chatham',
  '45': 'Avalon Park', '46': 'South Chicago', '47': 'Burnside', '48': 'Calumet Heights',
  '49': 'Roseland', '50': 'Pullman', '51': 'South Deering', '52': 'East Side',
  '53': 'West Pullman', '54': 'Riverdale', '55': 'Hegewisch', '56': 'Garfield Ridge',
  '57': 'Archer Heights', '58': 'Brighton Park', '59': 'McKinley Park', '60': 'Bridgeport',
  '61': 'New City', '62': 'West Elsdon', '63': 'Gage Park', '64': 'Clearing',
  '65': 'West Lawn', '66': 'Chicago Lawn', '67': 'West Englewood', '68': 'Englewood',
  '69': 'Greater Grand Crossing', '70': 'Ashburn', '71': 'Auburn Gresham', '72': 'Beverly',
  '73': 'Washington Heights', '74': 'Mount Greenwood', '75': 'Morgan Park', '76': 'O\'Hare',
  '77': 'Edgewater'
}

// Violation status mapping
export const VIOLATION_STATUS: Record<string, string> = {
  'OPEN': 'Open',
  'CLOSED': 'Closed',
  'COMPLIED': 'Complied',
  'NO ENTRY': 'No Entry',
  'VOID': 'Void'
}
