import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/react';
import { fetchReels, resetReels, uploadReel } from '../features/reels/reelsSlice';
import ReelCard from '../components/ReelCard';
import ReelUploadModal from '../components/ReelUploadModal';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';

const Reels = () => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { items, page, hasMore, loading, uploadLoading, error } = useSelector((state) => state.reels);
  const currentUser = useSelector((state) => state.user.value);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  const loadReels = async (requestedPage = 1) => {
    try {
      const token = await getToken();
      if (!token) return;
      await dispatch(fetchReels({ page: requestedPage, limit: 6, token }));
    } catch (err) {
      toast.error(err.message || 'Unable to load reels');
    }
  };

  useEffect(() => {
    dispatch(resetReels());
    loadReels(1);
  }, [dispatch, getToken]);

  const handleScroll = async (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    if (scrollHeight - scrollTop - clientHeight < 400 && hasMore && !fetchingMore && !loading) {
      setFetchingMore(true);
      await loadReels(page + 1);
      setFetchingMore(false);
    }
  };

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
            <ReelCard reel={reel} currentUser={currentUser} />
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
