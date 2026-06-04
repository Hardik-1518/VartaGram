import React, { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, AlertCircle, Play } from 'lucide-react';
import {
  validateVideoFile,
  getVideoDuration,
  validateVideoDuration,
  uploadVideoToCloudinary,
  createUploadAbortController,
  formatFileSize,
  formatDuration
} from '../utils/cloudinaryUpload';
import toast from 'react-hot-toast';

/**
 * ReelUploadModal - Production-ready video upload component
 * Features:
 * - Direct Cloudinary upload (no backend file handling)
 * - Real-time upload progress
 * - File and duration validation
 * - Upload cancellation support
 * - Comprehensive error handling
 * - Mobile-responsive UI
 */
const ReelUploadModal = ({ onClose, onUploadSuccess, loading: parentLoading }) => {
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Handle file selection and validation
   */
  const handleSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    setValidationError(null);
    setUploadError(null);

    if (!file) return;

    // Validate file
    const fileValidation = validateVideoFile(file);
    if (!fileValidation.valid) {
      setValidationError(fileValidation.error);
      toast.error(fileValidation.error);
      return;
    }

    try {
      // Get video duration
      const duration = await getVideoDuration(file);
      const durationValidation = validateVideoDuration(duration);

      if (!durationValidation.valid) {
        setValidationError(durationValidation.error);
        toast.error(durationValidation.error);
        return;
      }

      setVideoFile(file);
      setVideoDuration(duration);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadProgress(0);
      toast.success('Video selected successfully');
    } catch (error) {
      const errorMsg = error.message || 'Failed to process video';
      setValidationError(errorMsg);
      toast.error(errorMsg);
    }

    // Reset input for re-selection
    event.target.value = '';
  }, []);

  /**
   * Handle upload cancellation
   */
  const handleCancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
  }, []);

  /**
   * Handle upload process
   */
  const handleUpload = async () => {
    if (!videoFile) {
      toast.error('Please select a video first');
      return;
    }

    if (!caption.trim()) {
      toast.error('Please add a caption');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Create abort controller for this upload
      abortControllerRef.current = createUploadAbortController();

      // Upload to Cloudinary directly
      const result = await uploadVideoToCloudinary(
        videoFile,
        (progress) => setUploadProgress(progress),
        abortControllerRef.current.signal
      );

      // Upload successful, now save metadata to backend
      await onUploadSuccess({
        videoUrl: result.secure_url,
        caption: caption.trim(),
        cloudinaryPublicId: result.public_id,
        duration: videoDuration,
        fileSize: videoFile.size
      });

      // Reset form
      setCaption('');
      setVideoFile(null);
      setVideoDuration(null);
      setPreviewUrl(null);
      setUploadProgress(0);
      onClose();
      toast.success('Reel uploaded successfully!');
    } catch (error) {
      if (error.message === 'Upload cancelled') {
        setUploadError(null);
        toast.error('Upload cancelled');
        return;
      }
      const errorMsg = error.message || 'Upload failed. Please try again.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * Cleanup on unmount
   */
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [previewUrl]);

  const isLoading = uploading || parentLoading;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2'>
      <div className='w-full max-w-2xl max-h-[calc(100vh-1rem)] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-slate-950/60'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between gap-4'>
          <div>
            <h2 className='text-xl font-semibold text-white'>Upload New Vertical</h2>
            <p className='text-sm text-slate-400'>
              Short vertical videos perform best when kept under 10 minutes.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            disabled={isLoading}
            className='rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='grid gap-4 md:grid-cols-[2fr_1fr]'>
          {/* Video Upload Section */}
          <div className='rounded-3xl border border-slate-700 p-4'>
            {!videoFile ? (
              <label className='flex min-h-[10rem] w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-500/50 bg-slate-950 p-4 text-center text-slate-400 transition hover:border-cyan-400 disabled:opacity-50'>
                <UploadCloud className='mb-3 h-8 w-8 text-cyan-400' />
                <span className='text-sm font-medium text-slate-100'>Choose a video file</span>
                <span className='text-xs text-slate-500'>
                  MP4, MOV, or WEBM up to 500MB
                </span>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='video/*'
                  className='hidden'
                  onChange={handleSelect}
                  disabled={isLoading}
                />
              </label>
            ) : (
              <div className='space-y-3'>
                {/* Video Preview */}
                {previewUrl && (
                  <div className='relative rounded-3xl overflow-hidden bg-slate-950'>
                    <video
                      src={previewUrl}
                      controls
                      className='w-full max-h-72 object-cover'
                    />
                    {videoDuration && (
                      <div className='absolute bottom-2 right-2 bg-slate-950/80 px-3 py-1 rounded-full flex items-center gap-1 text-xs text-slate-300 border border-slate-700'>
                        <Play className='h-3 w-3' />
                        {formatDuration(videoDuration)}
                      </div>
                    )}
                  </div>
                )}

                {/* Video Info */}
                <div className='rounded-2xl border border-slate-700 bg-slate-950 p-3 space-y-2'>
                  <div className='text-sm'>
                    <p className='text-slate-400'>File size:</p>
                    <p className='text-slate-100'>{formatFileSize(videoFile.size)}</p>
                  </div>
                  {videoDuration && (
                    <div className='text-sm'>
                      <p className='text-slate-400'>Duration:</p>
                      <p className='text-slate-100'>{formatDuration(videoDuration)}</p>
                    </div>
                  )}
                </div>

                {/* Change Video Button */}
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className='w-full rounded-2xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:border-slate-500 disabled:opacity-50'
                >
                  Change Video
                </button>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className='mt-4 rounded-2xl border border-red-900/50 bg-red-950/30 p-3 flex gap-2'>
                <AlertCircle className='h-5 w-5 text-red-400 flex-shrink-0 mt-0.5' />
                <p className='text-sm text-red-300'>{validationError}</p>
              </div>
            )}
          </div>

          {/* Caption & Upload Section */}
          <div className='space-y-4 rounded-3xl border border-slate-700 p-4 flex flex-col'>
            <div className='flex-1'>
              <label className='mb-2 block text-sm font-medium text-slate-300'>
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={6}
                placeholder='Add a short, engaging caption...'
                disabled={isLoading}
                className='w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50 resize-none'
              />
              <p className='mt-2 text-xs text-slate-500'>
                {caption.length}/500 characters
              </p>
            </div>

            {/* Tips */}
            <div className='space-y-2 text-sm text-slate-400'>
              <p className='text-slate-200 font-medium'>Tips:</p>
              <ul className='list-disc space-y-1 pl-5'>
                <li>Keep verticals short and visually engaging.</li>
                <li>Use captions and strong hooks.</li>
                <li>Vertical video works best for mobile.</li>
              </ul>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div className='rounded-2xl border border-red-900/50 bg-red-950/30 p-3 flex gap-2'>
                <AlertCircle className='h-5 w-5 text-red-400 flex-shrink-0 mt-0.5' />
                <p className='text-sm text-red-300'>{uploadError}</p>
              </div>
            )}

            {/* Progress Bar */}
            {uploading && uploadProgress > 0 && (
              <div className='space-y-2'>
                <div className='flex justify-between text-xs text-slate-400'>
                  <span>Uploading to Cloudinary...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className='w-full h-2 rounded-full bg-slate-800 overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300'
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            {uploading ? (
              <button
                type='button'
                onClick={handleCancelUpload}
                className='w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700'
              >
                Cancel Upload
              </button>
            ) : (
              <button
                type='button'
                onClick={handleUpload}
                disabled={!videoFile || !caption.trim() || parentLoading}
                className='w-full rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed'
              >
                Upload Vertical
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelUploadModal;
