# Catholiques du Monde - Scheduled Content Landing Page

A premium, responsive landing page where content appears automatically based on predefined time slots.

## Features
- **Dynamic Content**: Displays different content (Image, Text, Video, Audio) based on the current time.
- **Admin Dashboard**: Easy management of content schedules.
- **Premium Design**: Minimalist white theme with spiritual aesthetics.
- **Responsive**: Fully functional on mobile and desktop.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, Sequelize.
- **Database**: MySQL.

## Getting Started

### Prerequisites
- Node.js installed.
- MySQL server running.
- Create a database named `catholiques_du_monde`.

### Installation

1. **Backend**:
   ```bash
   cd Backend
   npm install
   # Update .env with your database credentials
   npm start
   ```

2. **Frontend**:
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

## Admin Panel
Access the admin panel at `http://localhost:5173/admin` to schedule messages.
Example schedules:
- 06:00:00 - 07:00:00: Morning Gospel (Text)
- 07:00:00 - 08:00:00: Daily Verse (Image)
- 08:00:00 - 09:00:00: Hymn of the Day (Audio)
