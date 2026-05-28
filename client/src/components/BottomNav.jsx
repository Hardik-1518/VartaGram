import React from 'react'
import { NavLink } from 'react-router-dom'
import { menuItemsData } from '../assets/assets'

const BottomNav = () => {
  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-sm sm:hidden'>
      <div className='mx-auto flex max-w-3xl justify-between px-2 py-2'>
        {menuItemsData.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 px-2 py-1 text-center rounded-2xl transition-colors ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600'
              }`
            }
          >
            <Icon className='mx-auto h-5 w-5' />
            <span className='block text-[10px] leading-tight'>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
