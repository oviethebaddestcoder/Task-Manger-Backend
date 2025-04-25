const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const profilesDir = path.join(uploadDir, 'profiles');
const tasksDir = path.join(uploadDir, 'tasks');

[uploadDir, profilesDir, tasksDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration
const storage = multer.memoryStorage(); // Use memory storage for processing

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.match(/^image\/(jpeg|png|gif)$/)) {
      return cb(new Error('Only JPEG, PNG and GIF files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload endpoint
router.post('/', protect, async (req, res) => {
  try {
    upload.single('image')(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a file'
        });
      }

      // Validate the type parameter
      const validTypes = ['profile', 'task'];
      if (!req.body.type || !validTypes.includes(req.body.type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be either "profile" or "task".'
        });
      }

      try {
        // Generate unique filename
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const uploadPath = path.join(
          req.body.type === 'task' ? tasksDir : profilesDir,
          filename
        );

        // Process image with sharp
        await sharp(req.file.buffer)
          .resize(400, 400, { // Set max dimensions
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: 80 }) // Convert to WebP format
          .toFile(uploadPath);

        // Generate public URL
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${
          req.body.type === 'task' ? 'tasks' : 'profiles'
        }/${filename}`;

        res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          imageUrl: imageUrl
        });
      } catch (processError) {
        console.error('Image processing error:', processError);
        res.status(500).json({
          success: false,
          message: 'Error processing image',
          error: processError.message
        });
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload'
    });
  }
});

// Route to delete uploaded file (optional but recommended)
router.delete('/:filename', protect, (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, '../uploads/', filename);

        // Check if file exists
        if (fs.existsSync(filepath)) {
            // Delete file
            fs.unlinkSync(filepath);
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message
        });
    }
});

module.exports = router;
