const express = require('express');
const { GifReader } = require('omggif');
const GIFEncoder = require('gifencoder');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/split-gif', upload.single('gifFile'), async (req, res) => {
  const gifBuffer = req.file ? req.file.buffer : null;
  const N = parseInt(req.body.n, 10) || 1;
  const M = parseInt(req.body.m, 10) || 1;

  if (!gifBuffer) {
    return res.status(400).json({ error: 'No GIF file uploaded' });
  }

  try {
    const cells = await processGIF(gifBuffer, N, M);
    res.json({ cells });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing GIF' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

async function processGIF(gifBuffer, N, M) {
  return new Promise((resolve, reject) => {
    const reader = new GifReader(gifBuffer);

    const numFrames = reader.numFrames();
    const width = reader.width;
    const height = reader.height;

    const framesInfo = [];

    for (let i = 0; i < numFrames; i++) {
      const frameInfo = reader.frameInfo(i);

      const pixels = new Uint8Array(width * height * 4); 
      reader.decodeAndBlitFrameRGBA(i, pixels);

      framesInfo.push({
        pixels: pixels,
        delay: frameInfo.delay,
        disposal: frameInfo.disposal,
        transparentIndex: frameInfo.transparent_index,
        hasTransparency: frameInfo.transparent_index !== null,
        x: frameInfo.x,
        y: frameInfo.y,
        width: frameInfo.width,
        height: frameInfo.height,
      });
    }
    const cellWidth = Math.ceil(width / N);
    const cellHeight = Math.ceil(height / M);

    const cells = [];

    for (let cellRow = 0; cellRow < M; cellRow++) {
      for (let cellCol = 0; cellCol < N; cellCol++) {
        const cellFrames = [];
        const cellX = cellCol * cellWidth;
        const cellY = cellRow * cellHeight;
        const cellW = Math.min(cellWidth, width - cellX);
        const cellH = Math.min(cellHeight, height - cellY);

        let previousCanvas = new Uint8Array(cellW * cellH * 4).fill(0);

        for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
          const frame = framesInfo[frameIndex];
          const framePixels = frame.pixels;

          const cellPixels = extractRegion(
            framePixels,
            width,
            height,
            cellX,
            cellY,
            cellW,
            cellH
          );

          if (frameIndex > 0) {
            const prevDisposal = framesInfo[frameIndex - 1].disposal;
            if (prevDisposal === 2) {
              previousCanvas.fill(0);
            }
          }

          compositeFrame(
            previousCanvas,
            cellPixels,
            cellW,
            cellH,
            frame.hasTransparency
          );

          const delay = frame.delay;
          cellFrames.push({
            pixels: Buffer.from(previousCanvas), 
            delay: delay,
          });
        }

        encodeGif(cellFrames, cellW, cellH).then((gifBuffer) => {
          const base64Gif = gifBuffer.toString('base64');
          cells.push(`data:image/gif;base64,${base64Gif}`);

          if (cells.length === N * M) {
            resolve(cells);
          }
        }).catch(reject);
      }
    }
  });
}

function extractRegion(framePixels, frameWidth, frameHeight, x, y, w, h) {
  const regionPixels = new Uint8Array(w * h * 4);

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const sourceX = x + col;
      const sourceY = y + row;

      if (sourceX >= frameWidth || sourceY >= frameHeight) {
        continue;
      }

      const sourceIndex = (sourceY * frameWidth + sourceX) * 4;
      const destIndex = (row * w + col) * 4;

      regionPixels[destIndex] = framePixels[sourceIndex];       
      regionPixels[destIndex + 1] = framePixels[sourceIndex + 1];
      regionPixels[destIndex + 2] = framePixels[sourceIndex + 2];
      regionPixels[destIndex + 3] = framePixels[sourceIndex + 3]; 
    }
  }

  return regionPixels;
}

function compositeFrame(
  previousCanvas,
  currentFrame,
  width,
  height,
  hasTransparency
) {
  for (let i = 0; i < width * height * 4; i += 4) {
    if (hasTransparency && currentFrame[i + 3] === 0) {
      continue;
    } else {
      previousCanvas[i] = currentFrame[i];
      previousCanvas[i + 1] = currentFrame[i + 1];
      previousCanvas[i + 2] = currentFrame[i + 2];
      previousCanvas[i + 3] = currentFrame[i + 3];
    }
  }
}

function encodeGif(frames, width, height) {
  return new Promise((resolve, reject) => {
    const encoder = new GIFEncoder(width, height);
    const stream = encoder.createReadStream();
    const chunks = [];

    encoder.start();
    encoder.setRepeat(0);
    encoder.setQuality(10);

    frames.forEach(function (frame) {
      encoder.setDelay(frame.delay * 10);
      encoder.addFrame(frame.pixels);
    });

    encoder.finish();

    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}
