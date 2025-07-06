import React from 'react';
import './InfoSection.css';

const InfoSection = () => {
  return (
    <div className="info-section">
      <div className="info-text">
        <p>
          A novel space for artists and collectors to invest in fractional ownership of real-world art.
        </p>
      </div>
      <div className="frames-wrapper">
        <div className="frame" style={{cursor: 'not-allowed'}}><p>Explore Artists</p><h1>Discover diverse artistic talent.</h1></div>
        <div className="frame" style={{cursor: 'not-allowed'}}><p>Become a Collector</p><h1>Start building your personal art collection.</h1></div>
        <div className="frame" style={{cursor: 'not-allowed'}}><p>Discover Artworks</p><h1>Explore captivating creations.</h1></div>
      </div>
    </div>
  );
};

export default InfoSection; 