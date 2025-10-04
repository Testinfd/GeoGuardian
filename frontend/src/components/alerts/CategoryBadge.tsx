/**
 * CategoryBadge - Display fusion analysis category with icon
 */

import React from 'react';
import { 
  Building, 
  Mountain, 
  TreePine, 
  Droplet, 
  Waves,
  Sprout,
  Tractor,
  Sun,
  Flame,
  HelpCircle
} from 'lucide-react';

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryBadge({ category, size = 'md', className = '' }: CategoryBadgeProps) {
  const categoryConfig: Record<string, { icon: React.ReactElement; label: string; color: string }> = {
    illegal_construction: {
      icon: <Building />,
      label: 'Illegal Construction',
      color: 'bg-red-50 text-red-700 border-red-200'
    },
    illegal_mining: {
      icon: <Mountain />,
      label: 'Illegal Mining',
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    deforestation: {
      icon: <TreePine />,
      label: 'Deforestation',
      color: 'bg-red-50 text-red-700 border-red-200'
    },
    water_pollution: {
      icon: <Droplet />,
      label: 'Water Pollution',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    coastal_erosion: {
      icon: <Waves />,
      label: 'Coastal Erosion',
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    algal_bloom: {
      icon: <Sprout />,
      label: 'Algal Bloom',
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    agricultural_expansion: {
      icon: <Tractor />,
      label: 'Agricultural Expansion',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    seasonal_agriculture: {
      icon: <Sun />,
      label: 'Seasonal Agriculture',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    wildfire_damage: {
      icon: <Flame />,
      label: 'Wildfire Damage',
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    urban_heat_island: {
      icon: <Sun />,
      label: 'Urban Heat Island',
      color: 'bg-red-50 text-red-700 border-red-200'
    },
    normal_variation: {
      icon: <HelpCircle />,
      label: 'Normal Variation',
      color: 'bg-gray-50 text-gray-700 border-gray-200'
    },
    unknown: {
      icon: <HelpCircle />,
      label: 'Unknown',
      color: 'bg-gray-50 text-gray-700 border-gray-200'
    }
  };

  const config = categoryConfig[category] || categoryConfig.unknown;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1.5';

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border font-medium ${config.color} ${sizeClass} ${className}`}>
      {React.cloneElement(config.icon, { className: 'w-4 h-4' })}
      <span>{config.label}</span>
    </div>
  );
}
