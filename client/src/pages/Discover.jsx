import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import UserCard from '../components/UserCard'
import Loading from '../components/Loading'
import api from '../api/axios'
import { useAuth } from '@clerk/react'
import toast from 'react-hot-toast'

const Discover = () => {

  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const { getToken } = useAuth()

  const fetchUsers = async (search = '') => {

    try {

      const token = await getToken()
      if (!token) return

      const { data } = await api.post(
        '/api/user/discover',
        { input: search },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (data.success) {
        setUsers(data.users)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }

    setLoading(false)
  }

  const handleSearch = async (e) => {

    if (e.key === 'Enter') {

      setLoading(true)
      await fetchUsers(input)
      setInput('')
    }

  }

  useEffect(() => {

    const loadData = async () => {
      await fetchUsers()
    }

    loadData()

  }, [])

  if (loading) {
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
                onChange={(e)=>setInput(e.target.value)}
                onKeyUp={handleSearch}
              />

            </div>
          </div>
        </div>

        <div className='flex flex-wrap gap-6'>
          {users.map((user)=>(
            <UserCard key={user._id} user={user}/>
          ))}
        </div>

      </div>
    </div>
  )
}

export default Discover