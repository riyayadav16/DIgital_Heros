const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getPublishedDraws, getMyDrawHistory, uploadProof } = require('../controllers/draw.controller');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.get('/', getPublishedDraws);
router.get('/my-history', getMyDrawHistory);
router.post('/:id/proof', upload.single('proof'), uploadProof);

module.exports = router;
