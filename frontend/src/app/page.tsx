/**
 * Home Page
 * Main landing page for GeoGuardian
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { Satellite, BarChart3, Shield, Globe } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export default function HomePage() {
  const features = [
    {
      icon: Satellite,
      title: 'Real-time Satellite Analysis',
      description: 'Process Sentinel-2 satellite imagery with advanced algorithms for environmental change detection.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Multi-algorithm analysis including EWMA, CUSUM, and spectral analysis for comprehensive monitoring.',
    },
    {
      icon: Shield,
      title: 'Environmental Protection',
      description: 'Detect deforestation, coastal erosion, water quality changes, and urban expansion in real-time.',
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Monitor any location worldwide with comprehensive satellite data coverage.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Environmental Monitoring
            <span className="block text-primary-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Real-time satellite imagery analysis for environmental change detection. 
            Monitor deforestation, coastal erosion, water quality, and urban expansion with 
            research-grade algorithms and comprehensive visualizations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started Free
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Environmental Monitoring
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Leverage cutting-edge satellite technology and advanced algorithms 
            to monitor environmental changes with unprecedented accuracy.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center h-full">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Monitoring?
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of environmental scientists, researchers, and organizations 
            using GeoGuardian for real-time environmental monitoring.
          </p>
          <Link href="/auth/register">
            <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GG</span>
              </div>
              <span className="text-xl font-bold">GeoGuardian</span>
            </div>
            <p className="text-gray-400 mb-4">
              Environmental monitoring platform powered by satellite imagery analysis
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 GeoGuardian. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}