import React from 'react'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'
import { Outlet, Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'

const Layout = () => {

  const user = useSelector((state)=>state.user.value)
  const loading = useSelector((state)=>state.user.loading)

  if (loading || !user) {
    return <Loading />
  }

  return (
    <div className='w-full flex min-h-screen'>

      <Sidebar />

      <div className='flex-1 bg-slate-50 pb-20 sm:pb-0'>
        <div className='sm:hidden sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-2'>
          <Link to='/' className='flex items-center justify-center'>
            <img src={assets.logo} alt='VartaGram Logo' className='h-10 object-contain' />
          </Link>
        </div>

        <Outlet />
      </div>

      <BottomNav />

    </div>
  )
}

export default Layout