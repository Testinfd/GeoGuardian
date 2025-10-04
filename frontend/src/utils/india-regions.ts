/**
 * India Region Presets for AOI Creation
 * Provides quick access to different regions of India for environmental monitoring
 */

export interface RegionPreset {
  id: string
  name: string
  center: { lat: number; lng: number }
  zoom: number
  description: string
  category: 'region' | 'city' | 'protected' | 'coast' | 'river'
}

export const INDIA_REGIONS: RegionPreset[] = [
  // Major Regions
  {
    id: 'full-india',
    name: 'Full India',
    center: { lat: 20.5937, lng: 78.9629 },
    zoom: 5,
    description: 'Complete view of India including J&K',
    category: 'region'
  },
  {
    id: 'north-india',
    name: 'North India',
    center: { lat: 30.0, lng: 77.0 },
    zoom: 7,
    description: 'Punjab, Haryana, HP, Uttarakhand, Delhi NCR',
    category: 'region'
  },
  {
    id: 'south-india',
    name: 'South India',
    center: { lat: 13.0, lng: 77.5 },
    zoom: 7,
    description: 'Karnataka, Tamil Nadu, Kerala, Andhra Pradesh',
    category: 'region'
  },
  {
    id: 'east-india',
    name: 'East India',
    center: { lat: 22.5, lng: 88.0 },
    zoom: 7,
    description: 'West Bengal, Odisha, Jharkhand, Bihar',
    category: 'region'
  },
  {
    id: 'west-india',
    name: 'West India',
    center: { lat: 19.0, lng: 73.0 },
    zoom: 7,
    description: 'Maharashtra, Gujarat, Goa, Rajasthan',
    category: 'region'
  },
  {
    id: 'central-india',
    name: 'Central India',
    center: { lat: 23.0, lng: 79.0 },
    zoom: 7,
    description: 'Madhya Pradesh, Chhattisgarh',
    category: 'region'
  },
  {
    id: 'northeast-india',
    name: 'Northeast India',
    center: { lat: 26.0, lng: 92.0 },
    zoom: 7,
    description: 'Assam, Meghalaya, Arunachal, Tripura, Mizoram, Nagaland, Manipur',
    category: 'region'
  },
  
  // Major Cities
  {
    id: 'delhi-ncr',
    name: 'Delhi NCR',
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 11,
    description: 'National Capital Region - Urban expansion monitoring',
    category: 'city'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    center: { lat: 19.0760, lng: 72.8777 },
    zoom: 11,
    description: 'Financial capital - Coastal urban monitoring',
    category: 'city'
  },
  {
    id: 'bangalore',
    name: 'Bangalore',
    center: { lat: 12.9716, lng: 77.5946 },
    zoom: 11,
    description: 'IT hub - Urban lake and green space monitoring',
    category: 'city'
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    center: { lat: 22.5726, lng: 88.3639 },
    zoom: 11,
    description: 'Port city - Urban and riverine monitoring',
    category: 'city'
  },
  {
    id: 'chennai',
    name: 'Chennai',
    center: { lat: 13.0827, lng: 80.2707 },
    zoom: 11,
    description: 'Coastal city - Urban coastal monitoring',
    category: 'city'
  },
  
  // Protected Areas & Natural Features
  {
    id: 'western-ghats',
    name: 'Western Ghats',
    center: { lat: 15.2993, lng: 74.1240 },
    zoom: 9,
    description: 'Biodiversity hotspot - Forest cover monitoring',
    category: 'protected'
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans',
    center: { lat: 21.9497, lng: 88.9357 },
    zoom: 10,
    description: 'Mangrove forest - Coastal erosion & mangrove health',
    category: 'protected'
  },
  {
    id: 'jim-corbett',
    name: 'Jim Corbett National Park',
    center: { lat: 29.5300, lng: 78.7700 },
    zoom: 11,
    description: 'Wildlife sanctuary - Forest & wildlife monitoring',
    category: 'protected'
  },
  {
    id: 'kaziranga',
    name: 'Kaziranga National Park',
    center: { lat: 26.5775, lng: 93.1711 },
    zoom: 11,
    description: 'Rhino habitat - Wetland & grassland monitoring',
    category: 'protected'
  },
  
  // Coastal Regions
  {
    id: 'gujarat-coast',
    name: 'Gujarat Coast',
    center: { lat: 21.7645, lng: 72.1519 },
    zoom: 10,
    description: 'Industrial coastline - Coastal development monitoring',
    category: 'coast'
  },
  {
    id: 'kerala-backwaters',
    name: 'Kerala Backwaters',
    center: { lat: 9.4981, lng: 76.3388 },
    zoom: 10,
    description: 'Lagoon network - Water quality & ecosystem health',
    category: 'coast'
  },
  {
    id: 'chilika-lake',
    name: 'Chilika Lake',
    center: { lat: 19.8468, lng: 85.4667 },
    zoom: 11,
    description: 'Largest coastal lagoon - Wetland monitoring',
    category: 'coast'
  },
  
  // River Basins
  {
    id: 'ganga-varanasi',
    name: 'Ganga at Varanasi',
    center: { lat: 25.3176, lng: 82.9739 },
    zoom: 12,
    description: 'Holy river - Water quality & river dynamics',
    category: 'river'
  },
  {
    id: 'yamuna-delhi',
    name: 'Yamuna at Delhi',
    center: { lat: 28.6692, lng: 77.2506 },
    zoom: 12,
    description: 'Urban river - Pollution & flow monitoring',
    category: 'river'
  },
  {
    id: 'brahmaputra',
    name: 'Brahmaputra River',
    center: { lat: 26.1433, lng: 91.7898 },
    zoom: 10,
    description: 'Major river - Flood & erosion monitoring',
    category: 'river'
  },
  
  // Special Interest Areas
  {
    id: 'kashmir-valley',
    name: 'Kashmir Valley',
    center: { lat: 34.0837, lng: 74.7973 },
    zoom: 10,
    description: 'Mountain valley - Agricultural & snow cover monitoring',
    category: 'region'
  },
  {
    id: 'ladakh',
    name: 'Ladakh',
    center: { lat: 34.1526, lng: 77.5771 },
    zoom: 9,
    description: 'High altitude desert - Glacier & climate monitoring',
    category: 'region'
  },
  {
    id: 'thar-desert',
    name: 'Thar Desert',
    center: { lat: 27.0, lng: 71.0 },
    zoom: 9,
    description: 'Desert region - Desertification monitoring',
    category: 'region'
  },
  {
    id: 'andaman-nicobar',
    name: 'Andaman & Nicobar',
    center: { lat: 11.7401, lng: 92.6586 },
    zoom: 9,
    description: 'Island chain - Coral reef & forest monitoring',
    category: 'coast'
  }
]

// Category colors for UI
export const CATEGORY_COLORS = {
  region: 'bg-blue-100 text-blue-700',
  city: 'bg-purple-100 text-purple-700',
  protected: 'bg-green-100 text-green-700',
  coast: 'bg-cyan-100 text-cyan-700',
  river: 'bg-indigo-100 text-indigo-700'
}

// Category icons
export const CATEGORY_LABELS = {
  region: 'Region',
  city: 'City',
  protected: 'Protected Area',
  coast: 'Coastal',
  river: 'River Basin'
}

// Helper function to get regions by category
export function getRegionsByCategory(category: string): RegionPreset[] {
  return INDIA_REGIONS.filter(r => r.category === category)
}

// Helper function to search regions
export function searchRegions(query: string): RegionPreset[] {
  const lowercaseQuery = query.toLowerCase()
  return INDIA_REGIONS.filter(r => 
    r.name.toLowerCase().includes(lowercaseQuery) ||
    r.description.toLowerCase().includes(lowercaseQuery)
  )
}

