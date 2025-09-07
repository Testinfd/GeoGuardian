'use client';

import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface AnalysisType {
  id: string;
  name: string;
  description: string;
  algorithms: string[];
  icon: string;
  color: string;
}

const analysisTypes: AnalysisType[] = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    description: 'Full multi-algorithm environmental monitoring using all 4 detection methods',
    algorithms: ['EWMA', 'CUSUM', 'Spectral Analysis', 'VedgeSat'],
    icon: '🔬',
    color: 'purple'
  },
  {
    id: 'vegetation',
    name: 'Vegetation Monitoring',
    description: 'Focus on vegetation health, deforestation, and forest changes using EWMA',
    algorithms: ['EWMA Vegetation', 'CUSUM Deforestation', 'NDVI/EVI Analysis'],
    icon: '🌿',
    color: 'green'
  },
  {
    id: 'water',
    name: 'Water Quality Assessment',
    description: 'Monitor water bodies for algae blooms and quality changes using spectral analysis',
    algorithms: ['Spectral Water Analysis', 'EWMA Water Quality', 'CyFi Methods'],
    icon: '💧',
    color: 'blue'
  },
  {
    id: 'coastal',
    name: 'Coastal Monitoring',
    description: 'Track coastal erosion and vegetation edges using VedgeSat technology',
    algorithms: ['VedgeSat Edge Detection', 'Coastal Change Analysis', 'Subpixel Accuracy'],
    icon: '🏖️',
    color: 'cyan'
  },
  {
    id: 'construction',
    name: 'Construction Detection',
    description: 'Detect construction activity and urban expansion using CUSUM algorithms',
    algorithms: ['CUSUM Construction', 'BSI Analysis', 'Urban Change Detection'],
    icon: '🏗️',
    color: 'orange'
  }
];

interface AnalysisSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  showAlgorithmDetails?: boolean;
}

export default function AnalysisSelector({ 
  selectedType, 
  onTypeChange, 
  showAlgorithmDetails = true 
}: AnalysisSelectorProps) {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const getColorClasses = (color: string, selected: boolean) => {
    const baseClasses = {
      purple: selected ? 'bg-purple-100 border-purple-500 text-purple-900' : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300',
      green: selected ? 'bg-green-100 border-green-500 text-green-900' : 'bg-white border-gray-200 text-gray-700 hover:border-green-300',
      blue: selected ? 'bg-blue-100 border-blue-500 text-blue-900' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300',
      cyan: selected ? 'bg-cyan-100 border-cyan-500 text-cyan-900' : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300',
      orange: selected ? 'bg-orange-100 border-orange-500 text-orange-900' : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
    };
    return baseClasses[color as keyof typeof baseClasses] || baseClasses.purple;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🧠 Enhanced Analysis Options
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose your monitoring focus. Our enhanced system uses research-grade algorithms for 85%+ accuracy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const isExpanded = expandedType === type.id;

          return (
            <div
              key={type.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                getColorClasses(type.color, isSelected)
              }`}
              onClick={() => onTypeChange(type.id)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {/* Type header */}
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{type.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-1">{type.name}</h4>
                  <p className="text-sm opacity-80 mb-3">{type.description}</p>
                  
                  {/* Algorithm chips */}
                  {showAlgorithmDetails && (
                    <div className="flex flex-wrap gap-1">
                      {type.algorithms.slice(0, isExpanded ? undefined : 2).map((algorithm, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            isSelected 
                              ? 'bg-white bg-opacity-60' 
                              : 'bg-gray-100'
                          }`}
                        >
                          {algorithm}
                        </span>
                      ))}
                      {!isExpanded && type.algorithms.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedType(type.id);
                          }}
                          className={`text-xs px-2 py-1 rounded-full font-medium underline ${
                            isSelected 
                              ? 'bg-white bg-opacity-60' 
                              : 'bg-gray-100'
                          }`}
                        >
                          +{type.algorithms.length - 2} more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced features badge */}
              {type.id === 'comprehensive' && (
                <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                  <div className="text-xs font-semibold">
                    ⚡ RECOMMENDED: Uses all 4 algorithms + 13 spectral bands
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* System capabilities info */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-gray-900 mb-2">🚀 Enhanced System Capabilities</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">85%+</div>
            <div className="text-gray-600">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">4</div>
            <div className="text-gray-600">Algorithms</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">13</div>
            <div className="text-gray-600">Spectral Bands</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600">&lt;30s</div>
            <div className="text-gray-600">Processing</div>
          </div>
        </div>
      </div>
    </div>
  );
}