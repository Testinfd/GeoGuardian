/**
 * FusionBadge - Display risk level with visual indicators
 */

import React from 'react';
import { AlertTriangle, ShieldAlert, Info, AlertCircle } from 'lucide-react';

interface FusionBadgeProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  className?: string;
}

export function FusionBadge({ riskLevel, riskScore, className = '' }: FusionBadgeProps) {
  const config = {
    low: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <Info className="w-3 h-3" />,
      label: 'Low Risk'
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Medium Risk'
    },
    high: {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: <AlertTriangle className="w-3 h-3" />,
      label: 'High Risk'
    },
    critical: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <ShieldAlert className="w-3 h-3" />,
      label: 'Critical Risk'
    }
  };

  const { color, icon, label } = config[riskLevel] || config.low;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color} ${className}`}>
      {icon}
      <span>{label}</span>
      <span className="text-xs opacity-75">({(riskScore * 100).toFixed(0)}%)</span>
    </div>
  );
}
