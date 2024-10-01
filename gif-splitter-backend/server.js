const express = require('express');
const cors = require('cors');
const multer = require('multer');
const gifRoutes = require('./routes/gif');

const app = express();
app.use(cors());

// Middleware for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
app.use('/api/split-gif', upload.single('gifFile'), gifRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});