import React from 'react'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'

const Layout = () => {

  const user = useSelector((state)=>state.user.value)
  const loading = useSelector((state)=>state.user.loading)
  const location = useLocation()

  if (loading || !user) {
    return <Loading />
  }

  return (
    <div className='w-full flex min-h-screen'>

      <Sidebar />

      <div className='flex-1 bg-slate-50 pb-20 sm:pb-0'>
        {location.pathname === '/' && (
          <div className='sm:hidden sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-2'>
            <div className='flex items-center justify-between gap-4'>
              <Link to='/' className='flex items-center justify-center flex-1'>
                <img src={assets.logo} alt='VartaGram Logo' className='h-10 object-contain mx-auto' />
              </Link>
              <Link to='/messages' className='flex items-center justify-end text-indigo-600 hover:text-indigo-800'>
                <MessageSquare className='h-6 w-6' />
              </Link>
            </div>
          </div>
        )}

        <Outlet />
      </div>

      <BottomNav />

    </div>
  )
}

export default Layout
