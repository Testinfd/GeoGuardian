/**
 * Main Navigation Header Component
 * Navigation bar with authentication, user menu, and main navigation
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Bell,
  Map,
  BarChart3,
  AlertTriangle
} from 'lucide-react'
import { useAuth, useUser } from '@/stores/auth-store'
import { useUnreadCount } from '@/stores/alerts'
import { Button, Badge } from '@/components/ui'
import { NotificationBell, NotificationCenter, useNotifications } from '@/components/notifications/NotificationSystem'
import { cn } from '@/lib/design-system'

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  
  const user = useUser()
  const { signOut } = useAuth()
  const isAuthenticated = !!user
  const unreadCount = useUnreadCount()
  const { unreadCount: notificationUnreadCount } = useNotifications()
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/auth/login')
    }
  }
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, auth: true },
    { name: 'Areas', href: '/aoi', icon: Map, auth: true },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle, auth: true, badge: unreadCount },
    { name: 'Analysis', href: '/analysis', icon: BarChart3, auth: true },
  ]
  
  const publicNavigation = [
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ]
  
  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GG</span>
              </div>
              <span className="text-xl font-bold text-gray-900">GeoGuardian</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              // Authenticated navigation
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="danger" size="sm">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
                
                {/* Notification Bell */}
                <NotificationBell
                  onClick={() => setIsNotificationCenterOpen(true)}
                  className="mx-2"
                />
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      {user?.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <span className="hidden lg:block">{user?.full_name || user?.email}</span>
                  </button>
                  
                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Public navigation
              <>
                {publicNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="flex items-center space-x-4">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-primary-600 p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between text-gray-600 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="danger" size="sm">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
                
                {/* Mobile Notification Bell */}
                <button
                  onClick={() => {
                    setIsNotificationCenterOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center justify-between text-gray-600 hover:text-primary-600 hover:bg-gray-50 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                >
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                  </div>
                  {notificationUnreadCount > 0 && (
                    <Badge variant="danger" size="sm">
                      {notificationUnreadCount}
                    </Badge>
                  )}
                </button>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      {user?.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user?.full_name || 'User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {publicNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="primary" className="w-full justify-start">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </nav>
  )
}

export default Navigation
export { Navigation }