import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReelActions from './ReelActions';
import ReelComments from './ReelComments';
import { useAuth } from '@clerk/react';
import { useDispatch } from 'react-redux';
import { likeReel, commentReel, shareReel, saveReel } from '../features/reels/reelsSlice';
import toast from 'react-hot-toast';
import { Volume2, VolumeX } from 'lucide-react';

const ReelCard = ({ reel, currentUser, isActive }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const ownedBySelf = currentUser?._id === reel.user?._id;
  const liked = useMemo(() => reel.likes.includes(currentUser?._id), [reel.likes, currentUser]);
  const saved = useMemo(
    () => reel.saved_by?.includes(currentUser?._id) || reel.saved_by?.includes('self'),
    [reel.saved_by, currentUser]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          /* ignore autoplay block */
        });
      }
    } else {
      video.pause();
    }
  }, [isActive]);

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
      const shareUrl = `${window.location.origin}/verticals#${reel._id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Vertical link copied to clipboard');
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

  const handleNavigateToProfile = () => {
    navigate(`/profile/${reel.user._id}`);
  };

  

  return (
    <div className='relative flex h-[calc(100vh-64px)] sm:h-[calc(100vh-88px)] flex-col overflow-hidden bg-slate-950 text-white'>
      <div className='absolute inset-0 bg-black/70' />
      <video
        ref={videoRef}
        src={reel.video_url}
        className='absolute inset-0 h-full w-full object-cover'
        autoPlay
        muted={isMuted || !isActive}
        loop
        playsInline
        preload='metadata'
      />
      <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent' />

      <div className='relative z-10 flex flex-1 flex-col justify-between px-4 pb-6 pt-5 sm:px-6'>
        <div className='flex items-center justify-end'>
          <button
            type='button'
            onClick={() => setIsMuted((prev) => !prev)}
            className='rounded-full bg-slate-900/70 p-2 text-slate-100 transition hover:bg-slate-800'
            aria-label={isMuted ? 'Unmute reel' : 'Mute reel'}
          >
            {isMuted ? <VolumeX className='h-4 w-4' /> : <Volume2 className='h-4 w-4' />}
          </button>
        </div>

        <div className='space-y-3'>
          <div className='rounded-full bg-slate-900/70 px-3 py-1.5 w-fit flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition' onClick={handleNavigateToProfile}>
            <img src={reel.user.profile_picture} alt={reel.user.full_name} className='h-6 w-6 rounded-full object-cover ring-1 ring-cyan-400' />
            <div className='flex flex-col'>
              <p className='text-xs font-semibold'>{reel.user.full_name}</p>
              <p className='text-xs text-slate-300'>@{reel.user.username}</p>
            </div>
          </div>

          <div className='rounded-3xl bg-slate-900/70 p-4 shadow-xl shadow-slate-950/60'>
            <p className='text-base leading-7 text-slate-100'>{reel.caption || 'No caption added yet.'}</p>
          </div>

          <ReelActions
            className='absolute right-4 bottom-20'
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
