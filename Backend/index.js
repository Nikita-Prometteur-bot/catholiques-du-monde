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
    // Use IST timezone (UTC+5:30)
    const currentTime = moment().utcOffset('+05:30').format('HH:mm:ss');

    const content = await Content.findOne({
      where: {
        startTime: { [Op.lte]: currentTime },
        endTime: { [Op.gte]: currentTime }
      }
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
    const content = await Content.create(req.body);
    res.status(201).json(content);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// Update content
app.put('/api/admin/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Content.update(req.body, { where: { id } });

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