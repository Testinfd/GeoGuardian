// Enhanced mapping configuration for environmental monitoring
export interface TileProvider {
  name: string
  url: string
  attribution: string
  maxZoom: number
  type: 'base' | 'satellite' | 'hybrid'
  description: string
}

export const tileProviders: TileProvider[] = [
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    type: 'base',
    description: 'Standard street map view'
  },
  {
    name: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 17,
    type: 'satellite',
    description: 'High-resolution satellite imagery'
  },
  {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    type: 'base',
    description: 'Clean, minimal map style'
  },
  {
    name: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google',
    maxZoom: 20,
    type: 'hybrid',
    description: 'Satellite imagery with labels'
  }
]

// Default provider for environmental monitoring
export const defaultProvider = tileProviders.find(p => p.name === 'Esri World Imagery') || tileProviders[0]

// Sentinel Hub configuration (requires API key)
export const sentinelHubConfig = {
  baseUrl: 'https://services.sentinel-hub.com',
  instanceId: process.env.NEXT_PUBLIC_SENTINEL_HUB_INSTANCE_ID,
  apiKey: process.env.NEXT_PUBLIC_SENTINEL_HUB_API_KEY,
  // Supported satellite data sources
  dataSources: [
    {
      id: 'SENTINEL2_L1C',
      name: 'Sentinel-2 L1C',
      description: 'Multi-spectral imagery for land monitoring'
    },
    {
      id: 'SENTINEL1_IW',
      name: 'Sentinel-1 IW',
      description: 'Radar imagery for all-weather monitoring'
    },
    {
      id: 'LANDSAT8_L1',
      name: 'Landsat 8',
      description: 'Long-term land change monitoring'
    }
  ]
}

// Geographic bounds for India (your primary region)
export const indiaBounds = {
  north: 37.6,
  south: 6.4,
  west: 68.7,
  east: 97.25
}

export const defaultMapCenter = [20.0, 77.0] as [number, number] // Center of India
export const defaultZoom = 6
