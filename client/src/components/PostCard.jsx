import React, { useState, useMemo } from 'react'
import { BadgeCheck, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import { selectUser } from '../features/selectors'
import { useAuth } from '@clerk/react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const PostCard = ({post}) => {

    const contentText = post.content || ''
    // Memoize HTML rendering to prevent re-renders
    const postWithHashtags = useMemo(() => 
        contentText.replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>'),
        [contentText]
    )
    
    const imageUrls = post.image_urls || []
    const [likes, setLikes] = useState(post.likes_count || [])
    const [comments, setComments] = useState(post.comments || [])
    const [shareCount, setShareCount] = useState(post.share_count?.length || 0)
    const [showComments, setShowComments] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [commenting, setCommenting] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [deleted, setDeleted] = useState(false)
    const currentUser = useSelector(selectUser)

    const { getToken } = useAuth()

    // Memoize like status to prevent unnecessary recalculations
    const isLiked = useMemo(() => likes.includes(currentUser?._id), [likes, currentUser])

    const handleLike = async () => {
        try {
            const { data } = await api.post(`/api/post/like`, {postId: post._id}, {headers: { Authorization: `Bearer ${await getToken()}` }})

            if (data.success){
               toast.success(data.message) 
               setLikes(prev =>{
                if(prev.includes(currentUser._id)){
                    return prev.filter(id=> id !== currentUser._id)
                }else{
                    return [...prev, currentUser._id]
                }
               })
            }else{
                toast(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleComment = async () => {
        if (!commentText.trim()) return

        setCommenting(true)
        try {
            const { data } = await api.post(`/api/post/comment`, { postId: post._id, text: commentText.trim() }, { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                toast.success(data.message)
                setComments(prev => [...prev, data.comment])
                setCommentText('')
                setShowComments(true)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setCommenting(false)
    }

    const handleShare = async () => {
        setSharing(true)
        try {
            const { data } = await api.post(`/api/post/share`, { postId: post._id }, { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                setShareCount(data.share_count)
                const shareText = `Check out this post on VartaGram: ${window.location.origin}`
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(shareText)
                    toast.success('Share text copied to clipboard')
                } else {
                    toast.success(data.message)
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setSharing(false)
    }

    const handleDelete = async () => {
        if (!window.confirm('Delete this post?')) return

        try {
            const { data } = await api.delete(`/api/post/${post._id}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })

            if (data.success) {
                toast.success(data.message)
                setDeleted(true)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const navigate = useNavigate()

  if (deleted) return null

  return (
    <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl'>
        {/* User Info */}
        <div onClick={()=> navigate('/profile/' + post.user._id)} className='inline-flex items-center gap-3 cursor-pointer'>
            <img src={post.user.profile_picture} alt="" className='w-10 h-10 rounded-full shadow'/>
            <div>
                <div className='flex items-center space-x-1'>
                    <span>{post.user.full_name}</span>
                    <BadgeCheck className='w-4 h-4 text-blue-500'/>
                </div>
                <div className='text-gray-500 text-sm'>@{post.user.username} • {moment(post.createdAt).fromNow()}</div>
            </div>
        </div>
         {/* Content */}
         {contentText && <div className='text-gray-800 text-sm whitespace-pre-line' dangerouslySetInnerHTML={{__html: postWithHashtags}}/>}

       {/* Images */}
       {imageUrls.length > 0 && (
        <div className='grid grid-cols-2 gap-2'>
            {imageUrls.map((img, index)=>(
                <img src={img} key={index} className={`w-full h-48 object-cover rounded-lg ${imageUrls.length === 1 && 'col-span-2 h-auto'}`} alt="" />
            ))}
        </div>
       )}

        {/* Actions */}
        <div className='flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300'>
            <div className='flex items-center gap-1'>
                <Heart className={`w-4 h-4 cursor-pointer ${likes.includes(currentUser._id) && 'text-red-500 fill-red-500'}`} onClick={handleLike}/>
                <span>{likes.length}</span>
            </div>
            <div className='flex items-center gap-1 cursor-pointer' onClick={() => setShowComments(prev => !prev)}>
                <MessageCircle className="w-4 h-4"/>
                <span>{comments.length}</span>
            </div>
            <div className='flex items-center gap-1 cursor-pointer' onClick={handleShare}>
                <Share2 className="w-4 h-4"/>
                <span>{shareCount}</span>
            </div>
            {currentUser?._id === post.user?._id && (
                <div className='flex items-center gap-1 cursor-pointer text-red-600' onClick={handleDelete}>
                    <Trash2 className='w-4 h-4'/>
                    <span>Delete</span>
                </div>
            )}
        </div>

        {showComments && (
            <div className='border-t border-gray-200 pt-4 space-y-3'>
                <div className='space-y-3'>
                    {comments.length > 0 ? (
                        comments.slice(-3).map((comment) => (
                            <div key={comment._id || `${comment.user?._id}-${comment.text}`} className='text-sm'>
                                <span className='font-semibold'>{comment.user?.full_name || currentUser.full_name || 'User'}</span>
                                <span className='text-gray-700'> {comment.text}</span>
                            </div>
                        ))
                    ) : (
                        <p className='text-gray-500 text-sm'>No comments yet.</p>
                    )}
                </div>
                <div className='flex gap-2'>
                    <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder='Write a comment...'
                        className='flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200'
                    />
                    <button
                        onClick={handleComment}
                        disabled={!commentText.trim() || commenting}
                        className='bg-indigo-600 text-white px-4 py-2 rounded-full text-sm disabled:opacity-50'
                    >
                        {commenting ? 'Posting...' : 'Comment'}
                    </button>
                </div>
            </div>
        )}

        <div className='mt-2 text-right text-xs text-gray-500'>
            {sharing && 'Sharing...'}
        </div>

    </div>
  )
}

// Memoize PostCard to prevent unnecessary re-renders when parent re-renders
export default React.memo(PostCard)
