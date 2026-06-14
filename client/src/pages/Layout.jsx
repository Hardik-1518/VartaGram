import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'

const Layout = () => {

  const user = useSelector((state)=>state.user.value)
  const loading = useSelector((state)=>state.user.loading)
  const location = useLocation()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  if (loading || !user) {
    return <Loading />
  }

  return (
    <div className='w-full flex min-h-screen'>

      <Sidebar />

      <div className='flex-1 bg-slate-50 pb-20 sm:pb-0'>
        {location.pathname === '/' && (
          <div className='sm:hidden sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-2'>
            <div className='relative flex items-center justify-between gap-4'>
              <div className='flex items-center'>
                <button onClick={()=> setShowMenu((s)=>!s)} className='p-2 rounded-full text-slate-700 hover:bg-slate-100'>
                  <Plus className='h-5 w-5' />
                </button>
                {/* Menu */}
                {showMenu && (
                  <div className='absolute left-3 top-12 bg-white rounded-md shadow-md z-30 w-44 py-1'>
                    <button onClick={()=> { setShowMenu(false); navigate('/create-post') }} className='w-full text-left px-3 py-2 hover:bg-slate-50'>Create Post</button>
                    <button onClick={()=> { setShowMenu(false); navigate('/verticals', { state: { openUpload: true }}) }} className='w-full text-left px-3 py-2 hover:bg-slate-50'>Upload Verticals</button>
                    <button onClick={()=> { setShowMenu(false); navigate('/', { state: { openStory: true }}) }} className='w-full text-left px-3 py-2 hover:bg-slate-50'>Create Story</button>
                  </div>
                )}
              </div>

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
