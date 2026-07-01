import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { ImageIcon, SendHorizonal } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import api from '../api/axios'
import { addMessage, prependMessages, resetMessages, setMessages } from '../features/messages/messagesSlice'
import toast from 'react-hot-toast'

const ChatBox = () => {

  const { messages } = useSelector((state)=>state.messages)
  const { userId } = useParams()
  const { getToken } = useAuth()
  const dispatch = useDispatch()

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)

  const connections = useSelector((state)=>state.connections.connections)

  // Memoized fetch function
  const fetchUserMessages = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true)
      const token = await getToken()
      const { data } = await api.post(`/api/message/get?page=${pageNum}&limit=50`, { to_user_id: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        if (pageNum === 1) {
          dispatch(setMessages(data.messages))
        } else {
          dispatch(prependMessages(data.messages))
        }
        setPage(pageNum)
        setHasMore(data.hasMore)
      }
      setLoading(false)
    } catch (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }, [userId, getToken, dispatch])

  const sendMessage = async () => {

    try {

      if(!text && !image) return

      const token = await getToken()

      const formData = new FormData()

      formData.append('to_user_id', userId)
      formData.append('text', text)

      if(image){
        formData.append('image', image)
      }

      const { data } = await api.post('/api/message/send', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {

        setText('')
        setImage(null)

        dispatch(addMessage(data.message))

      } else {

        throw new Error(data.message)

      }

    } catch (error) {

      toast.error(error.message)

    }
  }

  const sortedMessages = useMemo(
    () => [...messages].sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt)),
    [messages]
  )

  const handleLoadEarlier = async () => {
    if (!hasMore || loading) return
    await fetchUserMessages(page + 1)
  }

  useEffect(()=>{
    fetchUserMessages(1)

    return ()=>{
      dispatch(resetMessages())
    }
  },[userId, dispatch, fetchUserMessages])

  useEffect(()=>{
    if(connections?.length){
      const foundUser = connections.find(
        connection => connection._id === userId
      )
      setUser(foundUser)
    }
  },[connections, userId])

  useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    })
  },[sortedMessages])

  if(!user) return null

  return (

    <div className='flex flex-col h-screen'>

      <div className='flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300'>

        <img src={user.profile_picture} alt="" className="size-8 rounded-full"/>

        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
        </div>

      </div>

      <div className='p-5 md:px-10 h-full overflow-y-scroll'>

        <div className='space-y-4 max-w-4xl mx-auto'>

          {hasMore && (
            <button
              onClick={handleLoadEarlier}
              disabled={loading}
              className='w-full max-w-xs mx-auto py-2 px-4 rounded-full bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200 transition'
            >
              {loading ? 'Loading earlier messages…' : 'Load earlier messages'}
            </button>
          )}

          {sortedMessages.map((message,index)=>(

            <div
              key={index}
              className={`flex flex-col ${
                message.to_user_id !== user._id
                ? 'items-start'
                : 'items-end'
              }`}
            >

              <div className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${
                message.to_user_id !== user._id
                ? 'rounded-bl-none'
                : 'rounded-br-none'
              }`}>

                {message.message_type === 'image' && (
                  <img
                    src={message.media_url}
                    className='w-full max-w-sm rounded-lg mb-1'
                    alt=""
                  />
                )}

                <p>{message.text}</p>

              </div>

            </div>

          ))}

          <div ref={messagesEndRef}/>

        </div>

      </div>

      <div className='px-4'>

        <div className='flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5'>

          <input
            type="text"
            className='flex-1 outline-none text-slate-700'
            placeholder='Type a message...'
            onKeyDown={e=> e.key === 'Enter' && sendMessage()}
            onChange={(e)=>setText(e.target.value)}
            value={text}
          />

          <label htmlFor="image">

            {image
              ? <img src={URL.createObjectURL(image)} alt="" className='h-8 rounded'/>
              : <ImageIcon className='size-7 text-gray-400 cursor-pointer'/>
            }

            <input
              type="file"
              id='image'
              accept="image/*"
              hidden
              onChange={(e)=>setImage(e.target.files[0])}
            />

          </label>

          <button
            onClick={sendMessage}
            className='bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full'
          >
            <SendHorizonal size={18}/>
          </button>

        </div>

      </div>

    </div>

  )
}

export default ChatBox