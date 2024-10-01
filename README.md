# Animated GIF Grid Splitter

## Overview
This web application allows users to upload an animated GIF, split it into a grid of smaller synchronized animated GIFs, and view the result in their browser.

## Features
- Upload an animated GIF file.
- Specify grid dimensions (rows and columns).
- Split the GIF into smaller parts while maintaining animation and synchronization.
- Display the grid of smaller GIFs on the front-end.

## How to Run the Application

### Prerequisites
- Node.js and npm installed.

### Clone project reposiory
   ```bash
   git clone https://github.com/jalopez526/animated-gif-grid-splitter.git
   ```

### Back-end (Node.js GIF Processor)

1. **Move to back-end folder**
   ```bash
   cd gif-splitter-backend

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start server**
   ```bash
   node server.js
   ```

### Front-end 

1. **Move to front-end folder**
   ```bash
    cd gif-splitter-frontend

2. **Install dependencies**
   ```bash
   npm install

3. **Start UI**
   ```bash
   npm run dev


## Usage

- Open the frontend app in the browser at http://localhost:3000.
- Upload an animated GIF and specify the grid dimensions (rows and columns) for splitting.
- Click the "Split Image" button to send the GIF to the backend for processing.
- The split GIFs will be displayed on the frontend.


## Dependencies and Libraries Used
Back-end:
- express - A lightweight Node.js framework to build APIs quickly and easily.
- omggif - A tool for reading and decoding GIF files, letting us extract frame details like pixels and timing.
- gifencoder - Helps us take the processed GIF frames and turn them back into smaller GIFs.
- multer - Handles file uploads in our app, specifically for handling GIF files in memory.
- cors - Allows our backend to accept requests from other origins, such as the frontend.

Front-end:
- react - A library for building interactive user interfaces, used here for the GIF upload form and displaying split GIFs.
- axios - A tool for making HTTP requests from the frontend to the backend.
- vite - A fast build tool that makes frontend development quicker and more efficient.

## Brief Explanation of Approach and Challenges Faced
Approach:
The goal of this project is to process an animated GIF by splitting it into smaller GIFs that retain their animation. This involves multiple steps, both in the frontend and backend.

Back-end:
- The backend handles the core GIF processing. When a GIF is uploaded, it’s processed using the omggif library to read each frame of the GIF.
- The GIF is split into a grid of smaller images, based on the user-specified dimensions (N x M). For each grid cell, the appropriate pixels are extracted from the original frames.
- These pixel regions are composited into new GIFs using gifencoder, and the final base64-encoded GIFs are sent back to the frontend.
- The backend ensures that the animation timing and transparency of the original GIF are preserved in the split versions.

Front-end:
The frontend is a React application where the user can upload a GIF, specify how many rows and columns to split the GIF into, and view the results.
Once the user submits the form, the frontend makes an API request to the backend with the GIF and the grid dimensions.
After receiving the processed split GIFs from the backend, they are displayed in a grid on the frontend, allowing the user to visually see the smaller animated GIFs in sync.

## Challenges Faced:
- Maintaining Animation Sync:
One of the challenges was to ensure that each split GIF retained the original animation timing and transparency settings. GIFs use various disposal methods for frames, which needed to be handled correctly during processing.