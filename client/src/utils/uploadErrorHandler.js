/**
 * Upload Error Handling & Recovery
 * Comprehensive error handling for Cloudinary direct uploads
 */

export class CloudinaryUploadError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'CloudinaryUploadError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      originalError: this.originalError?.message
    };
  }
}

/**
 * Error types and user-friendly messages
 */
export const UPLOAD_ERROR_TYPES = {
  // File validation errors
  INVALID_FILE_TYPE: {
    code: 'INVALID_FILE_TYPE',
    userMessage: 'Invalid video format. Please use MP4, MOV, or WEBM.',
    severity: 'warning'
  },
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    userMessage: 'Video file is too large. Maximum size is 500MB.',
    severity: 'warning'
  },
  FILE_TOO_SMALL: {
    code: 'FILE_TOO_SMALL',
    userMessage: 'Video file is too small (minimum 1MB).',
    severity: 'warning'
  },
  VIDEO_TOO_SHORT: {
    code: 'VIDEO_TOO_SHORT',
    userMessage: 'Video is too short (minimum 3 seconds).',
    severity: 'warning'
  },
  VIDEO_TOO_LONG: {
    code: 'VIDEO_TOO_LONG',
    userMessage: 'Video is too long (maximum 10 minutes).',
    severity: 'warning'
  },
  
  // Configuration errors
  CLOUDINARY_NOT_CONFIGURED: {
    code: 'CLOUDINARY_NOT_CONFIGURED',
    userMessage: 'Upload system not configured. Contact support.',
    severity: 'error'
  },
  INVALID_PRESET: {
    code: 'INVALID_PRESET',
    userMessage: 'Upload preset configuration invalid. Contact support.',
    severity: 'error'
  },
  
  // Network errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    userMessage: 'Network error. Check your connection and try again.',
    severity: 'error',
    recoverable: true
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    userMessage: 'Upload timed out. Please try again.',
    severity: 'error',
    recoverable: true
  },
  REQUEST_ABORTED: {
    code: 'REQUEST_ABORTED',
    userMessage: 'Upload was cancelled.',
    severity: 'info',
    recoverable: true
  },
  
  // Cloudinary errors
  CLOUDINARY_QUOTA_EXCEEDED: {
    code: 'CLOUDINARY_QUOTA_EXCEEDED',
    userMessage: 'Storage quota exceeded. Contact support.',
    severity: 'error'
  },
  CLOUDINARY_AUTH_ERROR: {
    code: 'CLOUDINARY_AUTH_ERROR',
    userMessage: 'Cloudinary authentication failed. Please try again.',
    severity: 'error'
  },
  CLOUDINARY_PROCESSING_ERROR: {
    code: 'CLOUDINARY_PROCESSING_ERROR',
    userMessage: 'Video processing failed. Try a different video.',
    severity: 'error'
  },
  
  // Backend errors
  INVALID_VIDEO_URL: {
    code: 'INVALID_VIDEO_URL',
    userMessage: 'Invalid video URL. Please try uploading again.',
    severity: 'error',
    recoverable: true
  },
  METADATA_SAVE_FAILED: {
    code: 'METADATA_SAVE_FAILED',
    userMessage: 'Failed to save video metadata. Please try again.',
    severity: 'error',
    recoverable: true
  },
  
  // Unknown errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    userMessage: 'An unexpected error occurred. Please try again.',
    severity: 'error',
    recoverable: true
  }
};

/**
 * Parse Cloudinary error response
 * @param {Object} errorResponse - Cloudinary error response
 * @returns {Object} { code, userMessage, details }
 */
export const parseCloudinaryError = (errorResponse) => {
  if (!errorResponse) {
    return UPLOAD_ERROR_TYPES.UNKNOWN_ERROR;
  }

  const error = errorResponse.error;
  if (!error) {
    return UPLOAD_ERROR_TYPES.UNKNOWN_ERROR;
  }

  // Map common Cloudinary error codes
  if (error.message?.includes('quota') || error.message?.includes('limit')) {
    return UPLOAD_ERROR_TYPES.CLOUDINARY_QUOTA_EXCEEDED;
  }
  if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
    return UPLOAD_ERROR_TYPES.CLOUDINARY_AUTH_ERROR;
  }
  if (error.message?.includes('format') || error.message?.includes('type')) {
    return UPLOAD_ERROR_TYPES.INVALID_FILE_TYPE;
  }
  if (error.message?.includes('size')) {
    return UPLOAD_ERROR_TYPES.FILE_TOO_LARGE;
  }

  // Default to processing error
  return {
    ...UPLOAD_ERROR_TYPES.CLOUDINARY_PROCESSING_ERROR,
    details: error.message || JSON.stringify(error)
  };
};

/**
 * Determine if error is recoverable (user can retry)
 * @param {Error} error
 * @returns {boolean}
 */
export const isRecoverableError = (error) => {
  if (error instanceof CloudinaryUploadError) {
    const errorType = UPLOAD_ERROR_TYPES[error.code];
    return errorType?.recoverable === true;
  }
  
  // Network errors are recoverable
  if (error.name === 'NetworkError' || error.message?.includes('Network')) {
    return true;
  }
  
  // Abort errors are recoverable
  if (error.message?.includes('abort')) {
    return false; // User cancelled intentionally
  }
  
  // Timeout errors are recoverable
  if (error.message?.includes('timeout')) {
    return true;
  }
  
  return false;
};

/**
 * Get user-friendly error message
 * @param {Error} error
 * @returns {string}
 */
export const getUserErrorMessage = (error) => {
  if (error instanceof CloudinaryUploadError) {
    const errorType = UPLOAD_ERROR_TYPES[error.code];
    return errorType?.userMessage || error.message;
  }
  
  // Check error message for common patterns
  const message = error.message || '';
  
  if (message.includes('Network')) {
    return UPLOAD_ERROR_TYPES.NETWORK_ERROR.userMessage;
  }
  if (message.includes('timeout')) {
    return UPLOAD_ERROR_TYPES.TIMEOUT.userMessage;
  }
  if (message.includes('format') || message.includes('type')) {
    return UPLOAD_ERROR_TYPES.INVALID_FILE_TYPE.userMessage;
  }
  if (message.includes('size')) {
    return UPLOAD_ERROR_TYPES.FILE_TOO_LARGE.userMessage;
  }
  
  return UPLOAD_ERROR_TYPES.UNKNOWN_ERROR.userMessage;
};

/**
 * Create detailed error log for debugging
 * @param {Error} error
 * @param {Object} context - Additional context (file, progress, etc)
 * @returns {Object} Log object
 */
export const createErrorLog = (error, context = {}) => {
  return {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    context: {
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href
    },
    recoverable: isRecoverableError(error),
    userMessage: getUserErrorMessage(error)
  };
};

/**
 * Log error to service (implement as needed)
 * @param {Object} errorLog
 */
export const logErrorToService = async (errorLog) => {
  try {
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    console.error('[Upload Error Log]', errorLog);
    
    // Example: Send to backend logging endpoint
    // await fetch('/api/logs/error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog)
    // });
  } catch (e) {
    console.error('Failed to log error:', e);
  }
};

/**
 * Network connectivity check
 * @returns {Promise<boolean>}
 */
export const checkNetworkConnectivity = async () => {
  try {
    // Use a small image from Cloudinary as test
    const response = await fetch(
      'https://res.cloudinary.com/demo/image/fetch/w_100/https://www.cloudinary.com/favicon.ico',
      { method: 'HEAD', mode: 'no-cors' }
    );
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Retry strategy with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise}
 */
export const retryWithBackoff = async (
  fn,
  maxRetries = 3,
  initialDelay = 1000
) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!isRecoverableError(error)) {
        throw error; // Don't retry non-recoverable errors
      }
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Browser capabilities check
 * @returns {Object} Capabilities
 */
export const checkBrowserCapabilities = () => {
  return {
    // File API support
    hasFileAPI: typeof File !== 'undefined' && typeof FileList !== 'undefined',
    
    // Blob support
    hasBlob: typeof Blob !== 'undefined',
    
    // XMLHttpRequest with upload progress
    hasXHRProgress:
      typeof XMLHttpRequest !== 'undefined' &&
      'upload' in new XMLHttpRequest(),
    
    // FormData support
    hasFormData: typeof FormData !== 'undefined',
    
    // Video HTML5 support
    hasVideoElement: typeof HTMLVideoElement !== 'undefined',
    
    // Canvas for thumbnail generation
    hasCanvas: typeof HTMLCanvasElement !== 'undefined',
    
    // URL.createObjectURL
    hasObjectURL: typeof URL !== 'undefined' && 'createObjectURL' in URL,
    
    // AbortController for cancellation
    hasAbortController: typeof AbortController !== 'undefined',
    
    // Local storage for retry state
    hasLocalStorage: typeof localStorage !== 'undefined'
  };
};

/**
 * Validate browser capabilities
 * @returns {Object} { supported: boolean, issues: string[] }
 */
export const validateBrowserCapabilities = () => {
  const capabilities = checkBrowserCapabilities();
  const issues = [];
  
  if (!capabilities.hasFileAPI) {
    issues.push('File API not supported');
  }
  if (!capabilities.hasXHRProgress) {
    issues.push('Upload progress tracking not supported');
  }
  if (!capabilities.hasVideoElement) {
    issues.push('Video element not supported');
  }
  if (!capabilities.hasCanvas) {
    issues.push('Canvas not supported (thumbnails unavailable)');
  }
  
  return {
    supported: issues.length === 0,
    issues,
    capabilities
  };
};
