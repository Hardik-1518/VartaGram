import React, { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

const ReelUploadModal = ({ onClose, onUpload, loading }) => {
  const [caption, setCaption] = useState('');
  const [video, setVideo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      return;
    }
    setVideo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!video) return;
    const formData = new FormData();
    formData.append('video', video);
    formData.append('caption', caption);
    await onUpload(formData);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2'>
      <div className='w-full max-w-2xl max-h-[calc(100vh-1rem)] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-slate-950/60'>
        <div className='mb-4 flex items-center justify-between gap-4'>
          <div>
            <h2 className='text-xl font-semibold text-white'>Upload New Reel</h2>
            <p className='text-sm text-slate-400'>Short videos perform best when kept under 60 seconds.</p>
          </div>
          <button type='button' onClick={onClose} className='rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='grid gap-4 md:grid-cols-[2fr_1fr]'>
          <div className='rounded-3xl border border-slate-700 p-4'>
            <label className='flex min-h-[10rem] w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-500/50 bg-slate-950 p-4 text-center text-slate-400 transition hover:border-cyan-400'>
              <UploadCloud className='mb-3 h-8 w-8 text-cyan-400' />
              <span className='text-sm font-medium text-slate-100'>Choose a video file</span>
              <span className='text-xs text-slate-500'>MP4, MOV, or WEBM up to 150MB</span>
              <input type='file' accept='video/*' className='hidden' onChange={handleSelect} />
            </label>
            {previewUrl && (
              <video src={previewUrl} controls className='mt-4 max-h-72 w-full rounded-3xl object-cover' />
            )}
          </div>

          <div className='space-y-4 rounded-3xl border border-slate-700 p-4'>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300'>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={6}
                placeholder='Add a short, engaging caption...'
                className='w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
              />
            </div>
            <div className='space-y-2 text-sm text-slate-400'>
              <p className='text-slate-200'>Tips:</p>
              <ul className='list-disc space-y-1 pl-5'>
                <li>Keep reels short and visually engaging.</li>
                <li>Use captions and strong hooks.</li>
                <li>Vertical video works best for mobile.</li>
              </ul>
            </div>
            <button
              type='button'
              onClick={handleUpload}
              disabled={!video || loading}
              className='w-full rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60'
            >
              {loading ? 'Uploading...' : 'Upload Reel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelUploadModal;
