# VartaGram Upload Migration & Verification Guide

## Pre-Migration Checklist

### Prerequisites

- [ ] Cloudinary account created and configured
- [ ] Upload preset created with `Unsigned` mode
- [ ] `.env.local` file updated with Cloudinary credentials
- [ ] `.env` file updated (if changing backend)
- [ ] Git repository clean (no uncommitted changes)
- [ ] Backup of current working code

```bash
# Backup current code
git checkout -b backup/before-upload-refactor
git push origin backup/before-upload-refactor
git checkout main
```

### Code Review

- [ ] Review `client/src/utils/cloudinaryUpload.js`
- [ ] Review updated `client/src/components/ReelUploadModal.jsx`
- [ ] Review updated `server/controllers/reelController.js`
- [ ] Review updated `server/routes/reelRoutes.js`
- [ ] Check `client/src/features/reels/reelsSlice.js` changes
- [ ] Check `client/src/pages/Reels.jsx` changes

## Local Testing

### 1. Environment Setup

```bash
# Frontend
cd client
cat > .env.local << 'EOF'
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=vartagram_reels
VITE_BASEURL=http://localhost:4000
EOF

# Backend
cd ../server
cat > .env << 'EOF'
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vartagram
CLERK_SECRET_KEY=sk_test_your_key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your_api_key
EOF
```

### 2. Start Services

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev

# Terminal 3: MongoDB (if using local)
mongod
```

### 3. Test Cases

#### Test Case 1: Small Video Upload (Happy Path)

- [ ] Open http://localhost:5173
- [ ] Navigate to Reels page
- [ ] Click "Upload Vertical"
- [ ] Select a small video (5-10MB)
- [ ] Add a caption
- [ ] Click upload
- [ ] Verify progress bar appears
- [ ] Verify upload completes
- [ ] Check Cloudinary Media Library (video appears)
- [ ] Check MongoDB (reel metadata saved)
- [ ] Verify reel appears in feed

**Expected Result:** ✅ Video uploaded successfully

#### Test Case 2: File Validation

- [ ] Select non-video file (image) → Should show error
- [ ] Select file > 500MB → Should show error
- [ ] Select file < 1MB → Should show error
- [ ] Select video < 3 seconds → Should show error
- [ ] Select video > 10 minutes → Should show error

**Expected Result:** ✅ All validations work correctly

#### Test Case 3: Upload Progress

- [ ] Open DevTools → Network tab
- [ ] Select 50MB+ video
- [ ] Click upload
- [ ] Verify progress bar updates in real-time
- [ ] Verify percentage shown matches upload progress
- [ ] Monitor network tab for XHR request

**Expected Result:** ✅ Progress tracking works

#### Test Case 4: Upload Cancellation

- [ ] Start uploading 100MB video
- [ ] Click "Cancel Upload" button
- [ ] Verify upload stops
- [ ] Verify progress bar disappears
- [ ] Verify modal stays open
- [ ] Select different video and retry

**Expected Result:** ✅ Cancellation works, user can retry

#### Test Case 5: Network Error Recovery

- [ ] Start upload
- [ ] Disconnect network (DevTools → Network → Offline)
- [ ] Verify error message appears
- [ ] Reconnect network
- [ ] Click retry (if implemented)

**Expected Result:** ✅ Error handled gracefully

#### Test Case 6: Empty Caption

- [ ] Select video
- [ ] Leave caption empty
- [ ] Try to upload
- [ ] Verify error: "Please add a caption"

**Expected Result:** ✅ Validation prevents upload

#### Test Case 7: Mobile Responsiveness

- [ ] Open DevTools → Device toolbar
- [ ] Test on iPhone 12 (375px)
- [ ] Test on iPad (768px)
- [ ] Test on Android phone (412px)
- [ ] Verify layout responsive
- [ ] Verify upload works

**Expected Result:** ✅ Mobile layout works

### 4. Backend Verification

```bash
# Check MongoDB for saved metadata
mongosh
use vartagram
db.reels.findOne({}, { video_url: 1, caption: 1, duration: 1, file_size: 1 })

# Output should show:
{
  _id: ObjectId("..."),
  video_url: "https://res.cloudinary.com/...",
  caption: "My awesome reel!",
  duration: 45.5,
  file_size: 52428800,
  createdAt: ISODate("2024-01-15T10:30:00.000Z")
}
```

### 5. Cloudinary Verification

```bash
# Open Cloudinary Dashboard
# Navigate to: Media Library → Folder: vartagram/reels
# Verify uploaded video appears
# Check transformations were applied
# Check video metadata (duration, size)
```

## Staging/Pre-Production Testing

### 1. Deploy to Staging Environment

```bash
# Build frontend
cd client
npm run build
# Check dist/ folder created

# Build backend (if using separate deployment)
cd ../server
npm run build
# Or ensure it's ready for Vercel

# Deploy to staging (e.g., Vercel Preview)
vercel --prod --build-env production
```

### 2. Run Full Test Suite on Staging

- [ ] Test Case 1: Small video upload
- [ ] Test Case 2: Large video (100MB+)
- [ ] Test Case 3: Mobile upload
- [ ] Test Case 4: Multiple sequential uploads
- [ ] Test Case 5: Concurrent uploads (2+ users)
- [ ] Test Case 6: Long wait (1 hour+)
- [ ] Test Case 7: Server restart during upload

### 3. Performance Testing

```javascript
// In browser console
const startTime = performance.now();
// Start upload
// When complete:
const endTime = performance.now();
console.log(`Upload took ${(endTime - startTime) / 1000} seconds`);
```

**Benchmarks:**
- 10MB video: < 30 seconds
- 50MB video: < 2 minutes
- 100MB video: < 5 minutes
- 500MB video: < 15 minutes

### 4. Analytics Check

```javascript
// Verify metadata saved with optional fields
db.reels.aggregate([
  { $match: { duration: { $exists: true } } },
  { $group: { _id: null, count: { $sum: 1 } } }
])
// Should return documents with duration/file_size
```

## Production Deployment

### 1. Production Checklist

- [ ] All local tests pass ✅
- [ ] Staging tests pass ✅
- [ ] Code review completed ✅
- [ ] Security review completed ✅
- [ ] Performance benchmarks acceptable ✅
- [ ] Error handling tested ✅
- [ ] Rollback plan documented ✅

### 2. Deployment Steps

```bash
# 1. Commit changes
git add .
git commit -m "refactor: direct Cloudinary upload for reels"

# 2. Create release tag
git tag v1.0.0-upload-refactor

# 3. Push to production branch
git push origin main
git push origin --tags

# 4. Trigger CI/CD pipeline (GitHub Actions, Vercel, etc.)
# Or manually deploy to production

# 5. Monitor deployment logs
```

### 3. Post-Deployment Validation

```bash
# Check frontend loads correctly
curl -I https://vartagram.vercel.app

# Check backend API responds
curl -I https://api.vartagram.com/

# Check reel upload endpoint
curl -X OPTIONS https://api.vartagram.com/api/reel/upload-metadata

# Check Cloudinary integration
# Upload test video via web UI
# Verify appears in Cloudinary dashboard
```

## Monitoring & Alerts

### 1. Real-time Monitoring

**Set up in Cloudinary Dashboard:**
- Media Library → Check upload folder daily
- Upload settings → Monitor quota usage
- Upload logs → Check for error patterns

**Set up in MongoDB:**
```javascript
// Weekly check for metadata completeness
db.reels.aggregate([
  { $group: {
    _id: null,
    total: { $sum: 1 },
    withDuration: { $sum: { $cond: [{ $exists: ["$duration"] }, 1, 0] } },
    withFileSize: { $sum: { $cond: [{ $exists: ["$file_size"] }, 1, 0] } }
  }}
])
```

### 2. Error Tracking

**Implement error logging:**

```javascript
// In uploadErrorHandler.js - integrate with error tracking
import * as Sentry from "@sentry/react";

export const logErrorToService = async (errorLog) => {
  Sentry.captureException(errorLog.error, {
    contexts: {
      upload: errorLog.context
    }
  });
};
```

### 3. Performance Metrics

**Track in Google Analytics or similar:**
- Upload initiation rate
- Upload success rate
- Average upload time by file size
- Upload error rate by error type
- Mobile vs desktop success rate

### 4. Alerts to Set Up

```
⚠️ Alert: Upload error rate > 5% in 1 hour
⚠️ Alert: Average upload time > 5 minutes for 100MB files
⚠️ Alert: Cloudinary quota usage > 80%
⚠️ Alert: MongoDB storage > 90%
```

## Rollback Procedure

### If Critical Issues Arise

```bash
# 1. Identify the issue
# Check error logs, MongoDB, Cloudinary dashboard

# 2. Immediate mitigation
# Disable upload button if possible
# Show maintenance message

# 3. Revert code
git revert HEAD

# 4. Redeploy to production
git push origin main

# 5. Verify old endpoint works
curl https://api.vartagram.com/api/reel/upload

# 6. Notify users
# Send notification about temporary upload issues
```

### Rollback Testing

Test rollback before deployment:

```bash
# 1. Checkout backup branch
git checkout backup/before-upload-refactor

# 2. Test locally
npm run dev

# 3. Verify old upload works
# Go to http://localhost:5173/reels
# Try upload

# 4. Return to main
git checkout main
```

## Success Metrics

### After Migration (Target Metrics)

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Upload success rate | 60% | 95%+ | ✅ |
| Avg upload time (50MB) | 3-5 min | 1-2 min | ✅ |
| Mobile upload success | 40% | 90%+ | ✅ |
| Max file size | 150MB | 500MB | ✅ |
| User-visible errors | 25% | <5% | ✅ |
| Backend processing time | 2-3 min | <100ms | ✅ |
| Vercel timeout errors | 15-20% | 0% | ✅ |

### Dashboard Queries

```javascript
// Success rate
db.reels.aggregate([
  { $group: {
    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
    total: { $sum: 1 },
    withUrl: { $sum: { $cond: [{ $exists: ["$video_url"] }, 1, 0] } }
  }},
  { $sort: { _id: -1 } }
])

// Average file size
db.reels.aggregate([
  { $group: {
    _id: null,
    avgSize: { $avg: "$file_size" },
    maxSize: { $max: "$file_size" },
    minSize: { $min: "$file_size" }
  }}
])

// Average duration
db.reels.aggregate([
  { $group: {
    _id: null,
    avgDuration: { $avg: "$duration" },
    maxDuration: { $max: "$duration" }
  }}
])
```

## Communication Plan

### Notify Users

**Before Deployment:**
- Email: "Improved video upload coming soon"
- In-app banner: "We're upgrading our upload system"

**After Deployment:**
- Email: "Upload system upgraded - faster, more reliable"
- In-app message: "Your uploads are now more reliable"

### Notify Team

- [ ] Slack notification when deployment starts
- [ ] Slack notification when deployment completes
- [ ] Daily monitoring report (first 7 days)
- [ ] Weekly report (first 4 weeks)

## Documentation Updates

- [ ] Update README.md with new upload flow
- [ ] Add troubleshooting guide to docs
- [ ] Update API documentation
- [ ] Add video tutorial to help center
- [ ] Update mobile app docs (if applicable)

## Maintenance Tasks

### Weekly (First Month)

- [ ] Check error logs in Sentry/LogRocket
- [ ] Verify Cloudinary quota usage
- [ ] Monitor upload success rates
- [ ] Check for user complaints
- [ ] Review performance metrics

### Monthly

- [ ] Analyze upload patterns
- [ ] Optimize chunk size if needed
- [ ] Review file size distribution
- [ ] Audit Cloudinary transformations
- [ ] Update monitoring rules

### Quarterly

- [ ] Security audit of upload presets
- [ ] Performance optimization review
- [ ] Cost analysis (bandwidth, storage)
- [ ] User feedback survey

## Conclusion

This migration significantly improves upload reliability and performance. Monitor closely for the first week, then scale monitoring to appropriate intervals.

**Key Metrics to Watch:**
- Upload success rate (should be 95%+)
- Average upload time (should be faster)
- User satisfaction (should increase)
- Error rates (should decrease)
