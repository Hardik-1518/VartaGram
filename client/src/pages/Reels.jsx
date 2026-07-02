import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/react';
import { selectReelMeta, selectUser } from '../features/selectors';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchReels, resetReels, uploadReel } from '../features/reels/reelsSlice';
import ReelCard from '../components/ReelCard';
import ReelUploadModal from '../components/ReelUploadModal';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';
import { buildOptimizedVideoUrl } from '../utils/videoUtils';
const Reels = () => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { items, page, hasMore, loading, uploadLoading, error } = useSelector(selectReelMeta);
  const currentUser = useSelector(selectUser);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [activeReelId, setActiveReelId] = useState(null);

  const loadReels = useCallback(async (requestedPage = 1) => {
    try {
      const token = await getToken();
      if (!token) return;
      await dispatch(fetchReels({ page: requestedPage, limit: 6, token }));
    } catch (err) {
      toast.error(err.message || 'Unable to load reels');
    }
  }, [dispatch, getToken]);

  useEffect(() => {
    dispatch(resetReels());
    loadReels(1);

    // open upload modal if navigated with state
    if (location?.state?.openUpload) {
      setShowUploadModal(true);
      // clear the location state so it doesn't reopen on back/refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [dispatch, loadReels, location, navigate]);

  const activeIndex = useMemo(
    () => items.findIndex((item) => item._id === activeReelId),
    [items, activeReelId]
  );

  useEffect(() => {
    if (items.length > 0 && !items.some((item) => item._id === activeReelId)) {
      setActiveReelId(items[0]._id);
    }
  }, [items, activeReelId]);

  useEffect(() => {
    const nextItem = items[activeIndex + 1]
    if (!nextItem) return

    const preloadUrl = buildOptimizedVideoUrl(nextItem.video_url)
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'video'
    link.href = preloadUrl
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [activeIndex, items])

  const handleScroll = useCallback(async (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const activeIndex = Math.round(scrollTop / clientHeight);
    const normalizedIndex = Math.min(Math.max(activeIndex, 0), items.length - 1);
    const activeItem = items[normalizedIndex];

    if (activeItem?._id && activeItem._id !== activeReelId) {
      setActiveReelId(activeItem._id);
    }

    if (scrollHeight - scrollTop - clientHeight < 400 && hasMore && !fetchingMore && !loading) {
      setFetchingMore(true);
      await loadReels(page + 1);
      setFetchingMore(false);
    }
  }, [items, activeReelId, page, hasMore, fetchingMore, loading, loadReels]);

  const reelCount = useMemo(() => items.length, [items.length]);

  if (!currentUser) {
    return <Loading />;
  }

  return (
    <div className='h-screen overflow-hidden bg-slate-950 text-white'>
      <div className='flex items-center justify-between border-b border-slate-800 px-4 py-2 sm:px-6 sm:py-3'>
        <div>
          <h1 className='text-xl font-semibold tracking-tight'>Verticals</h1>
          <p className='text-slate-400 text-xs mt-0.5 hidden sm:block'>Watch, create, and engage with short immersive vertical videos.</p>
        </div>
        <button
          className='rounded-full bg-cyan-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400'
          onClick={() => setShowUploadModal(true)}
        >
          Upload Vertical
        </button>
      </div>

      <div
        className='h-[calc(100vh-64px)] sm:h-[calc(100vh-88px)] overflow-y-auto snap-y snap-mandatory'
        onScroll={handleScroll}
      >
        {items.length === 0 && loading && (
          <div className='flex h-full items-center justify-center'>
            <Loading />
          </div>
        )}

        {items.map((reel) => (
          <div key={reel._id} className='snap-start min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-88px)]'>
            <ReelCard reel={reel} currentUser={currentUser} isActive={reel._id === activeReelId} />
          </div>
        ))}

        {fetchingMore && (
          <div className='flex items-center justify-center py-6'>
            <div className='h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent' />
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className='text-center text-slate-400 py-6'>No more verticals available.</div>
        )}

        {error && (
          <div className='text-center text-red-400 py-6'>{error}</div>
        )}
      </div>

      {showUploadModal && (
        <ReelUploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={async (uploadData) => {
            try {
              const token = await getToken();
              if (!token) return;
              
              // Video is already uploaded to Cloudinary
              // Now save metadata to backend
              await dispatch(uploadReel({
                videoUrl: uploadData.videoUrl,
                caption: uploadData.caption,
                token,
                metadata: {
                  duration: uploadData.duration,
                  fileSize: uploadData.fileSize,
                  cloudinaryPublicId: uploadData.cloudinaryPublicId
                }
              })).unwrap();
              
              toast.success('Vertical uploaded successfully');
              setShowUploadModal(false);
            } catch (uploadError) {
              toast.error(uploadError || 'Failed to save reel metadata');
            }
          }}
          loading={uploadLoading}
        />
      )}
    </div>
  );
};

export default Reels;
