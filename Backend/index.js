const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const Content = require('./models/Content');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const moment = require('moment');

dotenv.config();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS FIX (IMPORTANT)
app.use(cors({
  origin: [
    "https://catholiques-du-monde-git-main-nikita-prometteur-bots-projects.vercel.app",
    "https://catholiques-du-monde.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* ================= ROUTES ================= */

// Get current content
app.get('/api/content/current', async (req, res) => {
  try {
    // Get current Paris time (UTC+2)
    const now = new Date();
    const parisHours = now.getUTCHours() + 2;
    const parisMinutes = now.getUTCMinutes();
    const parisSeconds = now.getUTCSeconds();
    const currentTime = `${String(parisHours).padStart(2, '0')}:${String(parisMinutes).padStart(2, '0')}:${String(parisSeconds).padStart(2, '0')}`;

    // Get all content and filter manually since database stores ISO datetime strings
    const contents = await Content.findAll();
    
    // Find content where current time falls between start and end time
    const content = contents.find(c => {
      // Extract time from ISO datetime string (e.g., "2026-04-27T07:28:00.000Z" -> "07:28:00")
      const startTimeStr = c.startTime.includes('T') 
        ? c.startTime.split('T')[1].split('.')[0] 
        : c.startTime;
      const endTimeStr = c.endTime.includes('T') 
        ? c.endTime.split('T')[1].split('.')[0] 
        : c.endTime;
      
      return currentTime >= startTimeStr && currentTime <= endTimeStr;
    });

    if (!content) {
      return res.status(404).json({ message: 'No content scheduled for this time' });
    }

    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Get all content
app.get('/api/admin/content', async (req, res) => {
  try {
    const contents = await Content.findAll({
      order: [['startTime', 'ASC']]
    });
    res.json(contents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create content
app.post('/api/admin/content', async (req, res) => {
  try {
    // Extract time from ISO datetime strings (e.g., "2026-04-27T08:17:00.000Z" -> "08:17:00")
    const data = { ...req.body };
    if (data.startTime && data.startTime.includes('T')) {
      data.startTime = data.startTime.split('T')[1].split('.')[0];
    }
    if (data.endTime && data.endTime.includes('T')) {
      data.endTime = data.endTime.split('T')[1].split('.')[0];
    }
    
    console.log('Creating content with time:', data.startTime, '-', data.endTime);
    const content = await Content.create(data);
    console.log('Content created:', content.id);
    res.status(201).json(content);
  } catch (error) {
    console.error('Create content error:', error);
    res.status(400).json({ message: error.message, details: error.errors });
  }
});

// Update content
app.put('/api/admin/content/:id', async (req, res) => {
  try {
    // Extract time from ISO datetime strings (e.g., "2026-04-27T08:17:00.000Z" -> "08:17:00")
    const data = { ...req.body };
    if (data.startTime && data.startTime.includes('T')) {
      data.startTime = data.startTime.split('T')[1].split('.')[0];
    }
    if (data.endTime && data.endTime.includes('T')) {
      data.endTime = data.endTime.split('T')[1].split('.')[0];
    }
    
    console.log('Updating content with time:', data.startTime, '-', data.endTime);
    const { id } = req.params;
    const [updated] = await Content.update(data, { where: { id } });

    if (updated) {
      const updatedContent = await Content.findByPk(id);
      return res.json(updatedContent);
    }

    throw new Error('Content not found');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete content
app.delete('/api/admin/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Content.destroy({ where: { id } });

    if (deleted) {
      return res.json({ message: 'Content deleted' });
    }

    throw new Error('Content not found');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload file
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // ✅ FIXED BASE URL
    const baseUrl = process.env.BASE_URL || "https://catholiques-du-monde-2.onrender.com";
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

/* ================= SERVER START ================= */

sequelize.authenticate()
  .then(() => {
    console.log('Database connected ✅');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed ❌', err);

    // Still start server to avoid crash
    app.listen(PORT, () => {
      console.log(`Server running WITHOUT DB on port ${PORT}`);
    });
  });

module.exports = app;