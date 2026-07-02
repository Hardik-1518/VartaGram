import React, { memo, useEffect, useRef, useState, useCallback } from 'react'
import { ImageIcon, SendHorizonal } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import api from '../api/axios'
import { addMessage, prependMessages, resetMessages, setMessages } from '../features/messages/messagesSlice'
import { selectSortedMessages, selectConnectionById } from '../features/selectors'
import toast from 'react-hot-toast'

const MessageBubble = memo(({ message, isSentByCurrentUser }) => (
  <div
    className={`flex flex-col ${
      isSentByCurrentUser ? 'items-end' : 'items-start'
    }`}
  >
    <div className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${
      isSentByCurrentUser ? 'rounded-br-none' : 'rounded-bl-none'
    }`}>
      {message.message_type === 'image' && (
        <img
          src={message.media_url}
          className='w-full max-w-sm rounded-lg mb-1'
          alt=''
        />
      )}
      <p>{message.text}</p>
    </div>
  </div>
))
MessageBubble.displayName = 'MessageBubble'

const ChatBox = () => {

  const { userId } = useParams()
  const messages = useSelector(selectSortedMessages)
  const currentUser = useSelector((state) => selectConnectionById(state, userId))
  const { getToken } = useAuth()
  const dispatch = useDispatch()

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const messagesEndRef = useRef(null)

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
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [userId, getToken, dispatch])

  const sendMessage = useCallback(async () => {
    try {
      if (!text && !image) return

      const token = await getToken()
      const formData = new FormData()

      formData.append('to_user_id', userId)
      formData.append('text', text)

      if (image) {
        formData.append('image', image)
      }

      const { data } = await api.post('/api/message/send', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setText('')
        setImage(null)
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }
        dispatch(addMessage(data.message))
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }, [text, image, previewUrl, userId, getToken, dispatch])

  const sortedMessages = messages

  const handleLoadEarlier = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchUserMessages(page + 1)
  }, [hasMore, loading, page, fetchUserMessages])

  useEffect(() => {
    fetchUserMessages(1)

    return () => {
      dispatch(resetMessages())
    }
  }, [userId, dispatch, fetchUserMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages])
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])
  if (!currentUser) return null

  return (

    <div className='flex flex-col h-screen'>

      <div className='flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300'>

        <img src={currentUser.profile_picture} alt="" className="size-8 rounded-full"/>

        <div>
          <p className="font-medium">{currentUser.full_name}</p>
          <p className="text-sm text-gray-500 -mt-1.5">@{currentUser.username}</p>
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

          {sortedMessages.map((message) => (
            <MessageBubble
              key={message._id || message.createdAt}
              message={message}
              isSentByCurrentUser={message.to_user_id === user._id}
            />
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
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className='h-8 rounded' />
            ) : (
              <ImageIcon className='size-7 text-gray-400 cursor-pointer' />
            )}

            <input
              type="file"
              id='image'
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return

                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl)
                }
                setImage(file)
                setPreviewUrl(URL.createObjectURL(file))
              }}
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