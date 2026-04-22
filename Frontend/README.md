# Catholiques du Monde - Frontend

A scheduled content landing page that displays content based on predefined time slots. Built with React, TypeScript, and Vite.

## Features

### Landing Page (`/`)
- Responsive design for mobile and desktop
- Displays scheduled content automatically based on current time
- Real-time clock display
- Support for multiple content types: Text, Image, Audio, Video
- Download functionality (when enabled)
- Share/republish functionality
- Auto-refreshes content every minute

### Admin Panel (`/admin`)
- Protected by authentication
- Create and manage time slots
- Assign content to each time slot
- Edit or update scheduled content
- File upload support for media
- Time slot overlap validation
- Loading states and success/error notifications
- Logout functionality

## Authentication

**Demo Credentials:**
- Username: `admin`
- Password: `admin123`

Note: This is a simple client-side authentication for demo purposes. In production, implement proper backend authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure API URL in `.env`:
```
VITE_API_URL=http://localhost:5000
```

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── config/
│   └── api.ts          # API endpoint configuration
├── context/
│   └── AuthContext.tsx # Authentication context
├── pages/
│   ├── Home.tsx        # Landing page
│   ├── Admin.tsx       # Admin dashboard
│   └── Login.tsx       # Login page
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main app component with routing
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## API Endpoints

The frontend expects the following backend endpoints:

- `GET /api/content/current` - Get content for current time slot
- `GET /api/admin/content` - Get all scheduled content (admin)
- `POST /api/admin/content` - Create new schedule (admin)
- `PUT /api/admin/content/:id` - Update schedule (admin)
- `DELETE /api/admin/content/:id` - Delete schedule (admin)
- `POST /api/admin/upload` - Upload media file (admin)

## Technologies

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Framer Motion
- Lucide React Icons
