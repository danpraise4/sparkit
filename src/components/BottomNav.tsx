'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Layers, Heart, MessageCircle, User } from 'lucide-react'

const BottomNav = () => {
  const pathname = usePathname()

  const navItems = [
    { path: '/discover', icon: Layers, label: 'Encounters' },
    { path: '/matches', icon: MessageCircle, label: 'Chat', hasNotification: true },
    { path: '/matches/likes', icon: Heart, label: 'Like', hasNotification: true },
    { path: '/nearby', icon: MapPin, label: 'Nearby' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            let isActive = false
            if (item.path === '/nearby') {
              isActive = pathname === '/nearby'
            } else if (item.path === '/discover') {
              isActive = pathname === '/discover' || pathname?.startsWith('/discover/')
            } else if (item.path === '/matches/likes') {
              isActive = pathname === '/matches/likes'
            } else if (item.path === '/matches') {
              isActive = (pathname === '/matches' || pathname?.startsWith('/chat/')) && pathname !== '/matches/likes'
            } else if (item.path === '/profile') {
              isActive = pathname === '/profile' || pathname?.startsWith('/profile/')
            }
            
            return (
              <Link
                key={item.label}
                href={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.hasNotification && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  )}
                </div>
                <span 
                  className={`text-xs mt-1 transition-colors ${
                    isActive ? 'text-gray-900 font-semibold' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default BottomNav
