const { GifReader } = require('omggif');
const GIFEncoder = require('gifencoder');

exports.processGIF = (gifBuffer, N, M) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new GifReader(gifBuffer);
      const numFrames = reader.numFrames();
      const width = reader.width;
      const height = reader.height;

      const framesInfo = [];

      // Extract frame data and metadata for each frame
      for (let i = 0; i < numFrames; i++) {
        const frameInfo = reader.frameInfo(i);
        const pixels = new Uint8Array(width * height * 4);  // RGBA data
        reader.decodeAndBlitFrameRGBA(i, pixels);
        
        framesInfo.push({
          pixels,
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

      // Split the frames into grid cells and encode them into smaller GIFs
      splitFramesIntoCells(framesInfo, width, height, N, M)
        .then(cells => resolve(cells))
        .catch(err => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

// Function to split frames into cells and encode them into GIFs
const splitFramesIntoCells = (framesInfo, width, height, N, M) => {
  return new Promise((resolve, reject) => {
    const cellWidth = Math.ceil(width / N);
    const cellHeight = Math.ceil(height / M);
    const cells = [];

    for (let cellRow = 0; cellRow < M; cellRow++) {
      for (let cellCol = 0; cellCol < N; cellCol++) {
        const cellFrames = [];

        const cellX = cellCol * cellWidth;
        const cellY = cellRow * cellHeight;

            // Compute valid cell width and height to avoid negative values
        const cellW = Math.max(0, Math.min(cellWidth, width - cellX));
        const cellH = Math.max(0, Math.min(cellHeight, height - cellY));

        // Skip invalid cells that would result in zero or negative dimensions
        if (cellW <= 0 || cellH <= 0) {
          continue;
        }

        let previousCanvas = new Uint8Array(cellW * cellH * 4).fill(0);

        for (let frameIndex = 0; frameIndex < framesInfo.length; frameIndex++) {
          const frame = framesInfo[frameIndex];
          const framePixels = frame.pixels;

          const cellPixels = extractRegion(framePixels, width, height, cellX, cellY, cellW, cellH);

          if (frameIndex > 0) {
            const prevDisposal = framesInfo[frameIndex - 1].disposal;
            if (prevDisposal === 2) previousCanvas.fill(0); // Clear previous canvas if necessary
          }

          compositeFrame(previousCanvas, cellPixels, cellW, cellH, frame.hasTransparency);

          cellFrames.push({
            pixels: Buffer.from(previousCanvas),
            delay: frame.delay,
          });
        }

        // Encode the current cell frames into a GIF
        encodeGif(cellFrames, cellW, cellH)
          .then(gifBuffer => {
            const base64Gif = gifBuffer.toString('base64');
            cells.push(`data:image/gif;base64,${base64Gif}`);

            if (cells.length === N * M) {
              resolve(cells);
            }
          })
          .catch(reject);
      }
    }
  });
};

// Function to extract a region from the frame pixels
const extractRegion = (framePixels, frameWidth, frameHeight, x, y, w, h) => {
  const regionPixels = new Uint8Array(w * h * 4);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const sourceX = x + col;
      const sourceY = y + row;

      if (sourceX >= frameWidth || sourceY >= frameHeight) continue;

      const sourceIndex = (sourceY * frameWidth + sourceX) * 4;
      const destIndex = (row * w + col) * 4;

      regionPixels[destIndex] = framePixels[sourceIndex];
      regionPixels[destIndex + 1] = framePixels[sourceIndex + 1];
      regionPixels[destIndex + 2] = framePixels[sourceIndex + 2];
      regionPixels[destIndex + 3] = framePixels[sourceIndex + 3];
    }
  }
  return regionPixels;
};

// Function to composite a frame onto the previous canvas
const compositeFrame = (previousCanvas, currentFrame, width, height, hasTransparency) => {
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
};

// Function to encode GIF frames into a new GIF
const encodeGif = (frames, width, height) => {
  return new Promise((resolve, reject) => {
    const encoder = new GIFEncoder(width, height);
    const stream = encoder.createReadStream();
    const chunks = [];

    encoder.start();
    encoder.setRepeat(0);
    encoder.setQuality(10);

    frames.forEach((frame) => {
      encoder.setDelay(frame.delay * 10);  // Set delay
      encoder.addFrame(frame.pixels);
    });

    encoder.finish();

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};
