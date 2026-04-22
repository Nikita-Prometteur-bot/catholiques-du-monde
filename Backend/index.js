const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const Content = require('./models/Content');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const moment = require('moment');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes
// Get current content based on time
app.get('/api/content/current', async (req, res) => {
  try {
    const currentTime = moment().format('HH:mm:ss');
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
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all content
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

// Admin: Create content
app.post('/api/admin/content', async (req, res) => {
  try {
    const content = await Content.create(req.body);
    res.status(201).json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin: Update content
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

// Admin: Delete content
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

// Admin: Upload file
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync Database and Start Server
sequelize.sync().then(() => {
  console.log('Database connected and synced');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});
