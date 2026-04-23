# Deployment Guide

## Prerequisites
- GitHub account
- MySQL database (can use Railway, PlanetScale, or other cloud MySQL)
- Render or Railway account (for free hosting)

## Option 1: Deploy on Render (Free)

### Step 1: Set up MySQL Database
1. Go to [Railway.app](https://railway.app) and create an account
2. Click "New Project" → "Provision MySQL"
3. Once created, go to your MySQL database
4. Click "Connect" → "General" to get connection details
5. Note down: Host, Port, Username, Password, Database name

### Step 2: Push Code to GitHub
1. Create a new repository on GitHub
2. In your Backend folder:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 3: Deploy on Render
1. Go to [render.com](https://render.com) and create an account
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: catholiques-backend
   - **Region**: Singapore (or nearest to you)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Add Environment Variables (from your Railway MySQL):
   - `PORT`: 5000
   - `DB_HOST`: (from Railway)
   - `DB_PORT`: 3306
   - `DB_USER`: (from Railway)
   - `DB_PASS`: (from Railway)
   - `DB_NAME`: (from Railway)
   - `BASE_URL`: (your Render URL, e.g., https://catholiques-backend.onrender.com)
   - `NODE_ENV`: production
6. Click "Deploy Web Service"
7. Wait for deployment (2-3 minutes)
8. Your API will be live at: `https://catholiques-backend.onrender.com`

### Step 4: Set up File Storage (Important)
Render doesn't persist uploaded files. For production, use cloud storage:
- **Option A**: Use Cloudinary (recommended for images)
- **Option B**: Use AWS S3
- **Option C**: Use Supabase Storage

For now, uploads will work but files will be lost on redeploy.

## Option 2: Deploy on Railway (All-in-One)

### Step 1: Push to GitHub
Same as above

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will detect Node.js automatically
5. Add MySQL service:
   - Click "New Service" → "Database" → "MySQL"
6. Add environment variables:
   - Go to your web service → "Variables"
   - Add:
     - `PORT`: 5000
     - `DB_HOST`: (from MySQL service, use ${MYSQLHOST})
     - `DB_PORT`: 3306
     - `DB_USER`: (from MySQL service, use ${MYSQLUSER})
     - `DB_PASS`: (from MySQL service, use ${MYSQLPASSWORD})
     - `DB_NAME`: (from MySQL service, use ${MYSQLDATABASE})
     - `BASE_URL`: (your Railway URL)
     - `NODE_ENV`: production
7. Railway will deploy automatically

## Testing Your Deployment

Once deployed, test these endpoints:
- `GET https://your-url.com/api/content/current`
- `POST https://your-url.com/api/admin/login` (body: `{"username":"admin","password":"admin123"}`)

## Important Notes

1. **Security**: Change default admin credentials in production
2. **Database**: Use a managed MySQL service (Railway, PlanetScale, etc.)
3. **File Storage**: Implement cloud storage for persistent file uploads
4. **HTTPS**: Both Render and Railway provide free SSL certificates
5. **CORS**: Update frontend to use your new backend URL

## Frontend Update

After deployment, update your frontend:
```javascript
const API_URL = 'https://your-backend-url.com';
```

## Troubleshooting

If deployment fails:
1. Check logs in Render/Railway dashboard
2. Ensure all environment variables are set
3. Verify database connection details
4. Check that MySQL is accessible from the cloud
