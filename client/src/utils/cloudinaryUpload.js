/**
 * Cloudinary Direct Upload Utility
 * Handles direct browser-to-Cloudinary uploads with progress tracking and error handling
 * Production-ready for large video files (30+ seconds, 100MB+)
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Validation constants
export const VIDEO_CONSTRAINTS = {
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  MIN_FILE_SIZE: 1 * 1024 * 1024, // 1MB minimum for reasonable video
  ACCEPTED_TYPES: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
  MAX_DURATION_SECONDS: 600, // 10 minutes
  MIN_DURATION_SECONDS: 3 // 3 seconds minimum
};

/**
 * Validate video file before upload
 * @param {File} file - Video file to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateVideoFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!VIDEO_CONSTRAINTS.ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid video format. Supported: ${VIDEO_CONSTRAINTS.ACCEPTED_TYPES.map(t => t.split('/')[1]).join(', ')}`
    };
  }

  if (file.size < VIDEO_CONSTRAINTS.MIN_FILE_SIZE) {
    return { valid: false, error: 'Video file is too small (minimum 1MB)' };
  }

  if (file.size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Video file is too large (maximum ${VIDEO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB)`
    };
  }

  return { valid: true };
};

/**
 * Get video duration from file
 * @param {File} file - Video file
 * @returns {Promise<number>} Duration in seconds
 */
export const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video metadata'));
    });

    video.src = objectUrl;
  });
};

/**
 * Validate video duration
 * @param {number} duration - Duration in seconds
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateVideoDuration = (duration) => {
  if (duration < VIDEO_CONSTRAINTS.MIN_DURATION_SECONDS) {
    return {
      valid: false,
      error: `Video is too short (minimum ${VIDEO_CONSTRAINTS.MIN_DURATION_SECONDS} seconds)`
    };
  }

  if (duration > VIDEO_CONSTRAINTS.MAX_DURATION_SECONDS) {
    return {
      valid: false,
      error: `Video is too long (maximum ${Math.floor(VIDEO_CONSTRAINTS.MAX_DURATION_SECONDS / 60)} minutes)`
    };
  }

  return { valid: true };
};

/**
 * Upload video directly to Cloudinary
 * @param {File} file - Video file to upload
 * @param {Function} onProgress - Callback for upload progress (receives percentage 0-100)
 * @param {AbortSignal} signal - AbortSignal for cancellation support
 * @returns {Promise<Object>} Upload result { secure_url, public_id, etc. }
 */
export const uploadVideoToCloudinary = async (file, onProgress, signal) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'vartagram/reels');
  formData.append('resource_type', 'video');

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    // Setup abort listener
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
    }

    // Setup progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress?.(Math.min(percentComplete, 99)); // Cap at 99% until server confirms
      }
    });

    // Setup error handling
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload. Please check your connection and try again.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out. Please try again.'));
    });

    // Setup success handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          onProgress?.(100);
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || 'Cloudinary upload failed'));
        } catch (e) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Send request
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, true);
    xhr.timeout = 30 * 60 * 1000; // 30 minute timeout for large files
    xhr.send(formData);
  });
};

/**
 * Create abort controller for upload cancellation
 * @returns {AbortController}
 */
export const createUploadAbortController = () => {
  return new AbortController();
};

/**
 * Generate thumbnail from video
 * @param {File} file - Video file
 * @returns {Promise<string>} Base64 thumbnail data URL
 */
export const generateVideoThumbnail = async (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const objectUrl = URL.createObjectURL(file);

    video.addEventListener('loadedmetadata', () => {
      // Seek to 1 second to get a good thumbnail
      video.currentTime = Math.min(1, video.duration / 2);
    });

    video.addEventListener('seeked', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to generate thumbnail'));
    });

    video.src = objectUrl;
  });
};

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format duration to MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
