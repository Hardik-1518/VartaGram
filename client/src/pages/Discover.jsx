import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import UserCard from '../components/UserCard'
import VirtualList from '../components/VirtualList'
import Loading from '../components/Loading'
import api from '../api/axios'
import { useAuth } from '@clerk/react'
import toast from 'react-hot-toast'

const Discover = () => {

  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const searchTimeoutRef = useRef(null)

  const { getToken } = useAuth()

  const fetchUsers = useCallback(
    async (search = '', pageNum = 1) => {
      try {
        const token = await getToken()
        if (!token) return

        const { data } = await api.post(
          `/api/user/discover?page=${pageNum}&limit=20`,
          { input: search },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (!data.success) {
          toast.error(data.message)
          return
        }

        if (pageNum === 1) {
          setUsers(data.users)
        } else {
          setUsers((prev) => [...prev, ...data.users])
        }

        setPage(data.page)
        setHasMore(data.hasMore)
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  const handleSearch = useCallback(
    (e) => {
      const value = e.target.value
      setInput(value)

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        setLoading(true)
        fetchUsers(value, 1)
      }, 500)
    },
    [fetchUsers]
  )

  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < 300 && hasMore && !loading) {
        fetchUsers(input, page + 1)
      }
    },
    [fetchUsers, hasMore, loading, input, page]
  )

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers()
    }

    loadData()

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [fetchUsers])

  if (loading && users.length === 0) {
    return <Loading height="60vh" />
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto p-6'>

        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>
            Discover People
          </h1>

          <p className='text-slate-600'>
            Connect with amazing people and grow your network
          </p>
        </div>

        {/* Search */}
        <div className='mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80'>
          <div className='p-6'>
            <div className='relative'>

              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />

              <input
                type="text"
                placeholder='Search people by name, username, bio, or location...'
                className='pl-10 sm:pl-12 py-2 w-full border border-gray-300 rounded-md max-sm:text-sm'
                value={input}
                onChange={handleSearch}
              />

            </div>
          </div>
        </div>

        <div className='rounded-3xl border border-slate-200 bg-white shadow-sm'>
          {users.length > 0 ? (
            <VirtualList
              items={users}
              itemHeight={320}
              height='calc(100vh - 300px)'
              onScroll={handleScroll}
              renderItem={(user) => (
                <div key={user._id} className='px-4 py-3'>
                  <UserCard user={user} />
                </div>
              )}
            />
          ) : (
            <div className='min-h-[240px] flex items-center justify-center p-8'>
              {loading ? <Loading height='100px' /> : <p className='text-gray-500'>No users found</p>}
            </div>
          )}
          {loading && users.length > 0 && (
            <div className='py-4'>
              <Loading height='100px' />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Discover