# VartaGram Environment Configuration Templates

## Frontend Environment Variables

**File location:** `client/.env.local`

```env
# Cloudinary Configuration (Direct Uploads)
# Get these from https://cloudinary.com/console/dashboard
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=vartagram_reels

# Backend API
VITE_BASEURL=http://localhost:4000  # Development
# VITE_BASEURL=https://api.vartagram.com  # Production
```

### Getting Cloudinary Credentials

1. **Sign up:** https://cloudinary.com
2. **Find Cloud Name:**
   - Go to Dashboard
   - "Cloud Name" is displayed at the top
   - Example: `djk3h2n9x`

3. **Create Upload Preset:**
   - Dashboard → Settings → Upload
   - Find "Upload presets" section
   - Click "+ Add upload preset"
   - Configure:
     - **Name:** `vartagram_reels`
     - **Mode:** `Unsigned` (for frontend)
     - **Folder:** `vartagram/reels`
     - **Resource type:** Video
     - Click "Save"

4. **Set Upload Restrictions (Security):**
   - In the preset settings:
     - Max file size: `524288000` (500MB)
     - Allowed file types: `.mp4, .webm, .mov, .m4v`
     - Save again

## Backend Environment Variables

**File location:** `server/.env`

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vartagram

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_live_your_secret_key
CLERK_PUBLISHABLE_KEY=pk_live_your_public_key

# Cloudinary (Server-side utilities)
# Get API Key from Cloudinary Dashboard → Settings → API keys
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your_api_key
# API_SECRET should NEVER be exposed in frontend code

# Email Configuration (Optional - for notifications)
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_APP_PASSWORD=your_app_password

# Image Optimization (ImageKit)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_ENDPOINT=https://ik.imagekit.io/your_endpoint

# AI Features (Groq)
GROQ_API_KEY=your_groq_api_key

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=your_inngest_key
```

## Vercel Deployment Configuration

**File location:** Root `.env.production` (or via Vercel Dashboard)

```env
# Vercel sets these automatically
VERCEL_URL=vartagram.vercel.app
VERCEL_ENV=production

# Add these in Vercel Dashboard → Settings → Environment Variables

# Frontend (for client build)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=vartagram_reels
VITE_BASEURL=https://vartagram-server.vercel.app

# Backend (for server build)
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_live_...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your_api_key
```

### Vercel Deployment Steps

**Client (Frontend):**
```bash
cd client
npm run build
# Vercel auto-detects Vite and builds to dist/
```

**Server (Backend):**
```bash
cd server
# Vercel will run with Node.js
# Make sure package.json has:
{
  "scripts": {
    "start": "node server.js"
  }
}
```

## Local Development Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/VartaGram.git
cd VartaGram
```

### Step 2: Setup Frontend
```bash
cd client
npm install

# Create .env.local
cat > .env.local << 'EOF'
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=vartagram_reels
VITE_BASEURL=http://localhost:4000
EOF

npm run dev
# Runs on http://localhost:5173
```

### Step 3: Setup Backend
```bash
cd ../server
npm install

# Create .env
cat > .env << 'EOF'
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vartagram
CLERK_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your_api_key
EOF

npm run dev
# Or: node server.js
# Runs on http://localhost:4000
```

### Step 4: Test Upload
1. Open http://localhost:5173
2. Navigate to Reels
3. Click "Upload Vertical"
4. Select a video file
5. Verify upload to Cloudinary
6. Check MongoDB for metadata

## Environment Variable Reference

### Frontend (VITE_*)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary account ID | `djk3h2n9x` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset | `vartagram_reels` |
| `VITE_BASEURL` | Backend API URL | `http://localhost:4000` |

### Backend

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `MONGODB_URI` | MongoDB connection | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `CLERK_SECRET_KEY` | Auth secret | `sk_live_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary ID | `djk3h2n9x` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |

## Security Best Practices

### ✅ DO

- ✅ Use `.env.local` and `.env` (never commit)
- ✅ Add `.env.local` and `.env` to `.gitignore`
- ✅ Use environment-specific configs
- ✅ Rotate API keys regularly
- ✅ Use Vercel's encrypted environment variables
- ✅ Keep API secrets on backend only

### ❌ DON'T

- ❌ Expose API secrets in frontend code
- ❌ Commit `.env` files to git
- ❌ Use same credentials for dev/prod
- ❌ Share `.env` files via chat/email
- ❌ Use dummy API keys in commits
- ❌ Expose CLOUDINARY_API_SECRET anywhere

## Troubleshooting

### "Cloudinary configuration is missing"

**Solution:**
1. Check `.env.local` exists in `client/` folder
2. Verify `VITE_CLOUDINARY_CLOUD_NAME` is set
3. Verify `VITE_CLOUDINARY_UPLOAD_PRESET` is set
4. Restart dev server: `npm run dev`

### "Invalid upload preset"

**Solution:**
1. Go to Cloudinary Dashboard
2. Settings → Upload → Upload presets
3. Verify preset name matches `VITE_CLOUDINARY_UPLOAD_PRESET`
4. Verify preset mode is "Unsigned"
5. Check preset is not archived

### Backend returns 500 errors

**Solution:**
1. Check `.env` file has all required variables
2. Verify MongoDB connection string is correct
3. Check Clerk credentials are valid
4. See server logs: `npm run dev`

### Vercel deployment fails

**Solution:**
1. Add all environment variables in Vercel Dashboard
2. Use `VITE_` prefix for frontend variables
3. No prefix for backend variables
4. Test locally first: `npm run build`

## Example `.env.local` (Complete)

```env
# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=djk3h2n9x
VITE_CLOUDINARY_UPLOAD_PRESET=vartagram_reels

# Backend
VITE_BASEURL=http://localhost:4000
```

## Example `.env` (Complete)

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vartagram?retryWrites=true&w=majority

# Auth
CLERK_SECRET_KEY=sk_test_1234567890abcdef

# Cloudinary
CLOUDINARY_CLOUD_NAME=djk3h2n9x
CLOUDINARY_API_KEY=123456789

# Email (Optional)
NODEMAILER_EMAIL=noreply@vartagram.com
NODEMAILER_APP_PASSWORD=abcd efgh ijkl mnop

# ImageKit (Optional)
IMAGEKIT_PUBLIC_KEY=public_key
IMAGEKIT_PRIVATE_KEY=private_key
IMAGEKIT_ENDPOINT=https://ik.imagekit.io/vartagram

# Groq (Optional)
GROQ_API_KEY=gsk_1234567890abcdef

# Inngest (Optional)
INNGEST_EVENT_KEY=evt_123456789
```
