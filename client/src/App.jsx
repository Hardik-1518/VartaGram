import React, { useRef, Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {useUser, useAuth} from '@clerk/react'
import Layout from './pages/Layout'
import toast, {Toaster} from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { fetchUser } from './features/user/userSlice'
import { fetchConnections } from './features/connections/connectionsSlice'
import { addMessage } from './features/messages/messagesSlice'
import Notification from './components/Notification'
import Loading from './components/Loading'

const Login = lazy(() => import('./pages/Login'))
const Feed = lazy(() => import('./pages/Feed'))
const Messages = lazy(() => import('./pages/Messages'))
const ChatBox = lazy(() => import('./pages/ChatBox'))
const Connections = lazy(() => import('./pages/Connections'))
const Discover = lazy(() => import('./pages/Discover'))
const Profile = lazy(() => import('./pages/Profile'))
const CreatePost = lazy(() => import('./pages/CreatePost'))
const Reels = lazy(() => import('./pages/Reels'))

const App = () => {
  const { user, isLoaded } = useUser()
  const {getToken } = useAuth()
  const {pathname} = useLocation()
  const pathnameRef = useRef(pathname)

  const dispatch = useDispatch()

  useEffect(() => {

  if (!isLoaded || !user) return

  const fetchData = async () => {
    try {

      const token = await getToken()

      if (!token) return

      await dispatch(fetchUser(token))
      await dispatch(fetchConnections(token))

    } catch (error) {
      console.error("App fetch error:", error)
    }
  }

  fetchData()

}, [user, isLoaded, getToken, dispatch])

  useEffect(()=>{
    pathnameRef.current = pathname
  },[pathname])

  const eventSourceRef = useRef(null)

  useEffect(() => {
    if (!user?.id || !import.meta.env.VITE_BASEURL) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    const source = new EventSource(
      `${import.meta.env.VITE_BASEURL}/api/message/${user.id}`
    )

    eventSourceRef.current = source

    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (pathnameRef.current === `/messages/${message.from_user_id._id}`) {
          dispatch(addMessage(message))
        } else {
          toast.custom(
            (t) => <Notification t={t} message={message} />,
            { position: "bottom-right" }
          )
        }
      } catch (error) {
        console.error('Failed to parse incoming SSE message:', error)
      }
    }

    source.onerror = () => {
      source.close()
      eventSourceRef.current = null
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [user?.id, dispatch])
  
  return (
    <>
      <Toaster />
      <Suspense fallback={<div className='min-h-screen flex items-center justify-center bg-slate-50'><Loading /></div>}>
        <Routes>
          <Route path='/' element={ !user ? <Login /> : <Layout/>}>
            <Route index element={<Feed/>}/>
            <Route path='messages' element={<Messages/>}/>
            <Route path='messages/:userId' element={<ChatBox/>}/>
            <Route path='connections' element={<Connections/>}/>
            <Route path='discover' element={<Discover/>}/>
            <Route path='verticals' element={<Reels/>}/>
            <Route path='reels' element={<Navigate to='/verticals' replace />} />
            <Route path='profile' element={<Profile/>}/>
            <Route path='profile/:profileId' element={<Profile/>}/>
            <Route path='create-post' element={<CreatePost/>}/>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App
