import React, { useMemo, useState } from 'react';
import ReelActions from './ReelActions';
import ReelComments from './ReelComments';
import { useAuth } from '@clerk/react';
import { useDispatch } from 'react-redux';
import { likeReel, commentReel, shareReel, saveReel } from '../features/reels/reelsSlice';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ReelCard = ({ reel, currentUser }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const ownedBySelf = currentUser?._id === reel.user?._id;
  const liked = useMemo(() => reel.likes.includes(currentUser?._id), [reel.likes, currentUser]);
  const saved = useMemo(
    () => reel.saved_by?.includes(currentUser?._id) || reel.saved_by?.includes('self'),
    [reel.saved_by, currentUser]
  );

  const handleLike = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await dispatch(likeReel({ reelId: reel._id, token }));
    } catch (error) {
      toast.error(error.message || 'Could not like reel');
    }
  };

  const handleComment = async (text) => {
    if (!text.trim()) return;
    setCommentLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await dispatch(commentReel({ reelId: reel._id, text, token })).unwrap();
      setShowComments(true);
    } catch (error) {
      toast.error(error.message || 'Could not send comment');
    }
    setCommentLoading(false);
  };

  const handleShare = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await dispatch(shareReel({ reelId: reel._id, token })).unwrap();
      const shareUrl = `${window.location.origin}/reels#${reel._id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Reel link copied to clipboard');
    } catch (error) {
      toast.error(error.message || 'Could not share reel');
    }
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await dispatch(saveReel({ reelId: reel._id, token })).unwrap();
      toast.success(saved ? 'Removed from saved reels' : 'Saved to your collection');
    } catch (error) {
      toast.error(error.message || 'Could not save reel');
    }
  };

  const handleFollow = async () => {
    if (ownedBySelf || isFollowing) return;
    setFollowLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.post('/api/user/follow', { id: reel.user._id }, { headers: { Authorization: `Bearer ${token}` } });
      setIsFollowing(true);
      toast.success(`Following ${reel.user.full_name}`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to follow');
    }
    setFollowLoading(false);
  };

  

  return (
    <div className='relative flex h-[calc(100vh-88px)] flex-col overflow-hidden bg-slate-950 text-white'>
      <div className='absolute inset-0 bg-black/70' />
      <video
        src={reel.video_url}
        className='absolute inset-0 h-full w-full object-cover'
        autoPlay
        muted
        loop
        playsInline
        preload='metadata'
      />
      <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent' />

      <div className='relative z-10 flex flex-1 flex-col justify-between px-4 pb-6 pt-5 sm:px-6'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3 rounded-full bg-slate-900/70 px-3 py-2'>
            <img src={reel.user.profile_picture} alt={reel.user.full_name} className='h-11 w-11 rounded-full object-cover ring-2 ring-cyan-400' />
            <div>
              <h2 className='font-semibold'>{reel.user.full_name}</h2>
              <p className='text-sm text-slate-300'>@{reel.user.username}</p>
            </div>
          </div>
          {!ownedBySelf && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className='rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60'
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className='space-y-5'>
          <div className='rounded-3xl bg-slate-900/70 p-4 shadow-xl shadow-slate-950/60'>
            <p className='text-base leading-7 text-slate-100'>{reel.caption || 'No caption added yet.'}</p>
          </div>

          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <ReelActions
              liked={liked}
              likeCount={reel.likes.length}
              commentCount={reel.comments.length}
              shareCount={reel.share_count.length}
              saved={saved}
              onLike={handleLike}
              onComment={() => setShowComments((prev) => !prev)}
              onShare={handleShare}
              onSave={handleSave}
            />
          </div>

          {showComments && (
            <ReelComments
              comments={reel.comments}
              loading={commentLoading}
              onSubmit={handleComment}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReelCard;
