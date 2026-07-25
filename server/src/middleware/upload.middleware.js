const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Create local uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Config Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configure Cloudinary if not mock
const isCloudinaryMock = process.env.CLOUDINARY_CLOUD_NAME === 'mock_cloudinary' || !process.env.CLOUDINARY_CLOUD_NAME;

if (!isCloudinaryMock) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Middleware/helper to handle file uploads and return the URL
 */
const handleUpload = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    if (isCloudinaryMock) {
      // Local fallback
      const localUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      req.fileUrl = localUrl;
      req.fileLocalPath = req.file.path;
      return next();
    }

    // Cloudinary upload
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'infrastructure_audits',
      resource_type: 'image'
    });
    
    // Remove local temp file
    fs.unlinkSync(req.file.path);

    req.fileUrl = result.secure_url;
    req.fileLocalPath = null;
    next();
  } catch (error) {
    console.error('[Upload Middleware Error]', error.message);
    next(error);
  }
};

module.exports = {
  uploadSingle: upload.single('image'),
  handleUpload
};
