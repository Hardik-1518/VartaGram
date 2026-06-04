import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchReels = createAsyncThunk(
  'reels/fetchReels',
  async ({ page = 1, limit = 6, token }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/reel/all?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Upload reel - Direct Cloudinary upload
 * Frontend handles video upload to Cloudinary, backend saves metadata only
 */
export const uploadReel = createAsyncThunk(
  'reels/uploadReel',
  async ({ videoUrl, caption, token, metadata }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        '/api/reel/upload-metadata',
        {
          video_url: videoUrl,
          caption,
          // Optional metadata for analytics
          ...(metadata && {
            duration: metadata.duration,
            file_size: metadata.fileSize,
            cloudinary_public_id: metadata.cloudinaryPublicId
          })
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.reel;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const likeReel = createAsyncThunk(
  'reels/likeReel',
  async ({ reelId, token }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/reel/like', { reelId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { reelId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const commentReel = createAsyncThunk(
  'reels/commentReel',
  async ({ reelId, text, token }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/reel/comment', { reelId, text }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { reelId, comment: response.data.comment, comments: response.data.comments };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const shareReel = createAsyncThunk(
  'reels/shareReel',
  async ({ reelId, token }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/reel/share', { reelId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { reelId, shareCount: response.data.shareCount };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const saveReel = createAsyncThunk(
  'reels/saveReel',
  async ({ reelId, token }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/reel/save', { reelId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { reelId, saved: response.data.saved };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const reelsSlice = createSlice({
  name: 'reels',
  initialState: {
    items: [],
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
    uploadLoading: false,
    uploadError: null
  },
  reducers: {
    resetReels(state) {
      state.items = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReels.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.items = action.payload.reels;
        } else {
          state.items = [...state.items, ...action.payload.reels];
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchReels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(uploadReel.pending, (state) => {
        state.uploadLoading = true;
        state.uploadError = null;
      })
      .addCase(uploadReel.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(uploadReel.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = action.payload || action.error.message;
      })
      .addCase(likeReel.fulfilled, (state, action) => {
        const reel = state.items.find((item) => item._id === action.payload.reelId);
        if (reel) {
          if (!Array.isArray(reel.likes)) {
            reel.likes = [];
          }
          if (action.payload.liked) {
            reel.likes = [...new Set([...reel.likes, 'self'])];
          } else {
            reel.likes = reel.likes.filter((id) => id !== 'self');
          }
        }
      })
      .addCase(commentReel.fulfilled, (state, action) => {
        const reel = state.items.find((item) => item._id === action.payload.reelId);
        if (reel) {
          reel.comments = action.payload.comments;
        }
      })
      .addCase(shareReel.fulfilled, (state, action) => {
        const reel = state.items.find((item) => item._id === action.payload.reelId);
        if (reel) {
          reel.share_count = Array(action.payload.shareCount).fill('shared');
        }
      })
      .addCase(saveReel.fulfilled, (state, action) => {
        const reel = state.items.find((item) => item._id === action.payload.reelId);
        if (reel) {
          if (!Array.isArray(reel.saved_by)) {
            reel.saved_by = [];
          }
          if (action.payload.saved) {
            reel.saved_by = [...new Set([...reel.saved_by, 'self'])];
          } else {
            reel.saved_by = reel.saved_by.filter((id) => id !== 'self');
          }
        }
      });
      
  }
});

export const { resetReels } = reelsSlice.actions;
export default reelsSlice.reducer;
