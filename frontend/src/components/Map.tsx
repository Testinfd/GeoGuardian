'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  onPolygonComplete: (coordinates: number[][]) => void;
  existingPolygons?: Array<{
    id: string;
    name: string;
    coordinates: number[][];
    color?: string;
  }>;
  isDrawing: boolean;
  onToggleDrawing: () => void;
}

function DrawingHandler({ onPolygonComplete, isDrawing }: { 
  onPolygonComplete: (coordinates: number[][]) => void;
  isDrawing: boolean;
}) {
  const [currentPath, setCurrentPath] = useState<L.LatLng[]>([]);
  const map = useMapEvents({
    click: (e) => {
      if (isDrawing) {
        const newPath = [...currentPath, e.latlng];
        setCurrentPath(newPath);
        
        // Complete polygon on double click or when we have enough points
        if (newPath.length >= 3) {
          // Check if user clicked near the first point (close polygon)
          const firstPoint = newPath[0];
          const lastPoint = newPath[newPath.length - 1];
          const distance = firstPoint.distanceTo(lastPoint);
          
          if (distance < 1000 || newPath.length >= 10) { // 1km threshold or max 10 points
            const coordinates = newPath.map(point => [point.lng, point.lat]);
            coordinates.push(coordinates[0]); // Close the polygon
            onPolygonComplete(coordinates);
            setCurrentPath([]);
          }
        }
      }
    }
  });

  // Clear current path when drawing is disabled
  useEffect(() => {
    if (!isDrawing) {
      setCurrentPath([]);
    }
  }, [isDrawing]);

  // Render current drawing path
  if (currentPath.length > 0) {
    const positions = currentPath.map(point => [point.lat, point.lng] as [number, number]);
    return (
      <Polygon
        positions={positions}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
          dashArray: '5, 5'
        }}
      />
    );
  }

  return null;
}

export default function Map({ onPolygonComplete, existingPolygons = [], isDrawing, onToggleDrawing }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={[20.9517, 85.0985]} // Centered on Odisha, India
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Drawing handler */}
        <DrawingHandler onPolygonComplete={onPolygonComplete} isDrawing={isDrawing} />
        
        {/* Existing polygons */}
        {existingPolygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            positions={polygon.coordinates.map(coord => [coord[1], coord[0]] as [number, number])}
            pathOptions={{
              color: polygon.color || '#ef4444',
              fillColor: polygon.color || '#ef4444',
              fillOpacity: 0.3,
            }}
          />
        ))}
      </MapContainer>
      
      {/* Drawing controls */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onToggleDrawing}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDrawing 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isDrawing ? 'Cancel Drawing' : 'Draw Area'}
        </button>
      </div>
      
      {isDrawing && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
          <p className="text-sm text-gray-700">
            Click on the map to draw your area of interest. 
            <br />
            Click near the starting point or add 10 points to complete.
          </p>
        </div>
      )}
    </div>
  );
}
