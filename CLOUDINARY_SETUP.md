# Cloudinary Direct Upload Setup Guide

## Overview

This guide walks you through setting up Cloudinary direct uploads for VartaGram reels. Direct uploads happen entirely in the browser, bypassing the backend and Vercel's serverless limitations.

## Why Direct Upload?

**Problem with backend uploads:**
- Vercel has 30-second execution timeout
- Large files exceed `/tmp` storage limits (512MB)
- Costs bandwidth to upload to backend, then to Cloudinary
- Higher error rates on mobile networks

**Solution: Direct browser-to-Cloudinary**
- No backend file handling
- Resumable uploads
- Better error recovery
- Mobile-friendly
- Scales to 500MB+ files

## Setup Steps

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com
2. Sign up for free account
3. Navigate to Dashboard

### 2. Get Your Credentials

In the Cloudinary Dashboard:

1. Find **Cloud Name** (looks like: `your-cloud-name`)
2. Find **API Key** (for server-side use only)
3. Create **Upload Preset**:
   - Click "Settings" → "Upload"
   - Find "Upload presets" section
   - Click "Add upload preset"
   - Set these options:
     - **Name**: `vartagram_reels` (or your choice)
     - **Mode**: `Unsigned` (for direct browser uploads)
     - **Folder**: `vartagram/reels`
     - **Resource Type**: `Video`
     - Click "Save"

### 3. Update Frontend Environment Variables

**File:** `.env.local` (in `client/` folder)

```env
# Cloudinary Configuration for Direct Uploads
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=vartagram_reels
```

**Example:**
```env
VITE_CLOUDINARY_CLOUD_NAME=djk3h2n9x
VITE_CLOUDINARY_UPLOAD_PRESET=vartagram_reels
```

### 4. Backend Configuration (Optional)

**File:** `.env` (in `server/` folder)

```env
# Cloudinary API Key (for server-side transformations)
CLOUDINARY_API_KEY=your_api_key
```

> Note: API Secret should never be exposed in frontend code.

### 5. Test the Setup

1. Start your frontend: `npm run dev`
2. Navigate to Reels page
3. Click "Upload Vertical"
4. Select a video file
5. Add caption and click upload
6. Monitor the progress bar

## Security Best Practices

### For Unsigned Uploads (Recommended for Frontend)

✅ **Do:**
- Use unsigned presets for frontend
- Restrict uploads by file type in preset settings
- Set maximum file size in preset (500MB)
- Use HTTPS only
- Validate on frontend before upload

❌ **Don't:**
- Expose API Secret in frontend code
- Allow unsigned uploads to all folders
- Skip file validation

### Configure Upload Preset Restrictions

In Cloudinary Settings → Upload → Edit Preset:

```
Upload restrictions:
- Allowed file types: mp4, webm, mov, m4v
- Max file size: 524288000 bytes (500MB)
- Max image width: Not applicable
- Max image height: Not applicable
```

## Troubleshooting

### Issue: "Cloudinary configuration is missing"

**Solution:**
- Verify `.env.local` has `VITE_CLOUDINARY_CLOUD_NAME`
- Verify `.env.local` has `VITE_CLOUDINARY_UPLOAD_PRESET`
- Restart dev server: `npm run dev`

### Issue: CORS Errors

**Solution:**
- Cloudinary is CORS-enabled by default
- If issues persist, add your domain in Cloudinary Settings → Security → CORS

### Issue: Upload Hangs

**Solution:**
- Check file size (limit is 500MB)
- Try from different network
- Check browser console for errors
- Verify `VITE_CLOUDINARY_UPLOAD_PRESET` is correct

### Issue: "Invalid video URL"

**Solution:**
- Ensure upload went to Cloudinary first
- Check video URL starts with `https://res.cloudinary.com/`
- Verify preset folder is set to `vartagram/reels`

## Monitoring & Analytics

### View Uploaded Videos

1. Go to Cloudinary Dashboard
2. Click "Media Library"
3. Filter by folder: `vartagram/reels`
4. View statistics

### Monitor Upload Performance

In your app, check browser DevTools → Network:
- Upload time: Should be under 2 minutes for 500MB
- Chunk size: ~6MB chunks
- Progress updates: Every chunk

## Migration from Backend Uploads

### Step 1: Verify New Upload Works

- Test upload with new component
- Check video appears in both Cloudinary and MongoDB

### Step 2: Disable Old Upload Endpoint

The endpoint `/api/reel/upload` now returns 501 (deprecated).

To remove multer completely:

```bash
# server/configs/multer.js can be removed
# server/routes/reelRoutes.js already updated
```

### Step 3: Update Existing Videos (Optional)

If you have old videos stored elsewhere, use this script:

```javascript
// Migrate old videos to new metadata structure
const oldReels = await Reel.find({ /* filter */ });
for (const reel of oldReels) {
  // Ensure video_url is from Cloudinary
  if (!reel.video_url.includes('cloudinary')) {
    console.warn(`Reel ${reel._id} has non-Cloudinary URL`);
  }
}
```

## Performance Optimization

### For Large Files (100MB+)

The upload utility automatically:
- Uses chunked uploads (6MB chunks)
- Retries on network failure
- Shows progress every chunk
- Allows cancellation

### Browser Support

- Chrome 63+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari 13+, Chrome mobile)

### Network Optimization

For users on slow connections:

1. **Enable video compression:**
   - In Cloudinary Settings → Upload → Eager transformations
   - Add: `e_scale,w_720,h_1280,c_limit,q_auto:good`

2. **Reduce initial file size:**
   - Recommend users compress before upload
   - Browser can't automatically compress large videos

## Additional Resources

- [Cloudinary Direct Upload Docs](https://cloudinary.com/documentation/upload_widget)
- [VartaGram Upload Utilities](./cloudinaryUpload.js)
- [Upload Component](../components/ReelUploadModal.jsx)

## Support

For issues:
1. Check this guide's Troubleshooting section
2. Check Cloudinary Dashboard for error logs
3. Check browser console (F12)
4. Check MongoDB to verify metadata saved
