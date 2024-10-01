const { processGIF } = require('../services/gif');
const MAX_GRID_SIZE = 20;

exports.splitGif = async (req, res) => {
  const gifBuffer = req.file ? req.file.buffer : null;
  const N = parseInt(req.body.n, 10) || 1;
  const M = parseInt(req.body.m, 10) || 1;

  if (N > MAX_GRID_SIZE || M > MAX_GRID_SIZE) {
    return res.status(400).json({
      error: `Grid size too large. Please select N and M values less than or equal to ${MAX_GRID_SIZE}.`
    });
  }

  if (!gifBuffer) {
    return res.status(400).json({ error: 'No GIF file uploaded' });
  }

  try {
    const cells = await processGIF(gifBuffer, N, M);
    res.json({ cells });
  } catch (err) {
    console.error('Error processing GIF:', err);
    res.status(500).json({ error: 'Error processing GIF' });
  }
};
