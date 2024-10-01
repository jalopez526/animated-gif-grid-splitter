import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [gifFile, setGifFile] = useState(null);
  const [n, setN] = useState(10);
  const [m, setM] = useState(10);
  const [finalN, setFinalN] = useState(10);
  const [finalM, setFinalM] = useState(10);
  const [splitGifs, setSplitGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setGifFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gifFile) {
      alert('Please select a GIF file.');
      return;
    }

    const formData = new FormData();
    formData.append('gifFile', gifFile);
    formData.append('n', n);
    formData.append('m', m);

    setLoading(true);
    setFinalM(m)
    setFinalN(n)
    setSplitGifs([]);

    try {
      const response = await axios.post('http://localhost:5000/api/split-gif', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSplitGifs(response.data.cells);
    } catch (error) {
      console.error(error);
      alert('Error processing GIF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="left-panel">
        <form className="form" onSubmit={handleSubmit}>
          <button type="button" className="upload-button">
            Upload Image File
            <input
              type="file"
              accept="image/gif"
              onChange={handleFileChange}
              className="file-input"
            />
          </button>
          {gifFile && (
            <img src={URL.createObjectURL(gifFile)} alt="Uploaded" className="uploaded-image" />
          )}
          <div className="input-group">
            <div>
              <label>Rows</label>
              <input
                type="number"
                min="1"
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="number-input"
              />
            </div>
            <div>
              <label>Columns</label>
              <input
                type="number"
                min="1"
                value={m}
                onChange={(e) => setM(e.target.value)}
                className="number-input"
              />
            </div>
          </div>
          <button type="submit" className="split-button">
            {loading ? 'Processing...' : 'Split Image'}
          </button>
        </form>
      </div>
      <div className="right-panel">
        <h3>Splitted Images</h3>
        {splitGifs.length > 0 ? (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${finalM}, 1fr)`,
              gridTemplateRows: `repeat(${finalN}, 1fr)`,
            }}
          >
            {splitGifs.map((gifDataUrl, index) => (
              <div className="grid-item" key={index}>
                <img src={gifDataUrl} alt={`Cell ${index}`} />
              </div>
            ))}
          </div>
        ) : (
          <p>No images to display</p>
        )}
      </div>
    </div>
  );
}

export default App;
