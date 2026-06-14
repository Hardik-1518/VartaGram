import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import { Link, useLocation } from 'react-router-dom'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'
import { useAuth } from '@clerk/react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Feed = () => {

  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()
  const location = useLocation()

  const fetchFeeds = async () => {
    try {
      setLoading(true)

      const token = await getToken()

      if (!token) {
        setLoading(false)
        return
      }

      const { data } = await api.get('/api/post/feed', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setFeeds(data.posts)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error("Feed error:", error)
      toast.error(error.message)
    }

    setLoading(false)
  }

useEffect(() => {
  const loadFeeds = async () => {
    await fetchFeeds()
  }

  loadFeeds()
}, [getToken])

  if (loading) {
    return <Loading />
  }

  return (
    <div className='h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8'>

      {/* Stories and post list */}
      <div>
        <StoriesBar openCreateModal={location?.state?.openStory} />

        <div className='p-4 space-y-6'>
          {feeds.length > 0 ? (
            feeds.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          ) : (
            <p className="text-gray-500 text-center">No posts yet</p>
          )}
        </div>
      </div>

      {/* Right Sidebar (Desktop only) */}
      <div className='hidden xl:block sticky top-0 self-start'>
        <div className='w-80 space-y-4'>
          <div className='bg-white text-xs p-4 rounded-md flex flex-col gap-2 shadow'>
            <h3 className='text-slate-800 font-semibold'>Sponsored</h3>
            <img src={assets.sponsored_img} className='w-full h-50 rounded-md object-cover' alt="" />
            <p className='text-slate-600'>Email marketing</p>
            <p className='text-slate-400'>
              Supercharge your marketing with a powerful, easy-to-use platform built for results.
            </p>
          </div>

          <Link to='/messages' className='block bg-white p-4 rounded-md shadow hover:shadow-lg transition'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-slate-900 font-semibold mb-2'>Messages</h3>
                <p className='text-xs text-slate-500'>Quick access to your recent chats.</p>
              </div>
              <span className='text-indigo-600 text-sm'>View</span>
            </div>
            <RecentMessages />
          </Link>
        </div>
      </div>

    </div>
  )
}

export default Feed