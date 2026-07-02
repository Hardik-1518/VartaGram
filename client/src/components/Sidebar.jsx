import React from 'react'
import { assets, dummyUserData } from '../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import MenuItems from './MenuItems'
import { CirclePlus } from 'lucide-react'
import { UserButton } from '@clerk/react'
import { useSelector } from 'react-redux';
import { selectUser } from '../features/selectors'

const Sidebar = () => {

    const navigate = useNavigate()
    const user = useSelector(selectUser)

  return (
    <div className='hidden sm:flex w-60 xl:w-72 bg-white border-r border-gray-200 flex flex-col justify-between items-center'>
      <div className='w-full'>
            <img onClick={()=> navigate('/')} src={assets.logo} className='w-48 ml-7 my-2 cursor-pointer' alt="" />
            <hr className='border-gray-300 mb-8'/>

            <MenuItems />

            <Link to='/create-post' className='flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-lg  bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 transition text-white cursor-pointer'>
                <CirclePlus className='w-5 h-5'/>
                Create Post
            </Link>
      </div>

        <div className='w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between'>
            <div className='flex gap-2 items-center cursor-pointer'>
                <UserButton />
                <div>
                    <div>
                        <h1 className='text-sm font-medium'>{user?.full_name || "User"}</h1>
                        <p className='text-xs text-gray-500'>@{user?.username || "username"}</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
  )
}

export default Sidebar
