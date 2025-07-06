import React from 'react';
import './GradientBlur.css';

const gradBlurStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '200px', 
  pointerEvents: 'none',
  zIndex: 1,
};

const layerStyle = (zIndex, blur, mask) => ({
  position: 'absolute',
  inset: 0,
  zIndex,
  backdropFilter: `blur(${blur})`,
  WebkitBackdropFilter: `blur(${blur})`,
  maskImage: mask,
  WebkitMaskImage: mask,
  borderRadius: '0px',
  pointerEvents: 'none',
});

const layers = [
  { zIndex: 1, blur: '0.140625px', mask: 'linear-gradient(to top, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 12.5%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 0) 37.5%)' },
  { zIndex: 2, blur: '0.28125px', mask: 'linear-gradient(to top, rgba(0, 0, 0, 0) 12.5%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 1) 37.5%, rgba(0, 0, 0, 0) 50%)' },
  { zIndex: 3, blur: '0.5625px', mask: 'linear-gradient(to top, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 1) 37.5%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 62.5%)' },
  { zIndex: 4, blur: '1.125px', mask: 'linear-gradient(to top, rgba(0, 0, 0, 0) 37.5%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 1) 62.5%, rgba(0, 0, 0, 0) 75%)' },
  { zIndex: 5, blur: '2.25px', mask: 'linear-gradient(to top, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 1) 62.5%, rgba(0, 0, 0, 1) 75%, rgba(0, 0, 0, 0) 87.5%)' },
  { zIndex: 6, blur: '4.5px', mask: 'linear-gradient(to top, rgba(0, 0, 0, 0) 62.5%, rgba(0, 0, 0, 1) 75%, rgba(0, 0, 0, 1) 87.5%, rgba(0, 0, 0, 0) 100%)' },
  { zIndex: 7, blur: '9px', mask: 'linear-gradient(to top, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 1) 87.5%, rgba(0, 0, 0, 1) 100%)' },
  { zIndex: 8, blur: '18px', mask: 'linear-gradient(to top, rgba(0, 0, 0, 0) 87.5%, rgba(0, 0, 0, 1) 100%)' },
];

function GradientBlur({ isVisible }) {
  const classes = `blur-container ${isVisible ? 'blur-visible' : 'blur-hidden'}`;

  return (
    <div style={gradBlurStyle} className={classes}>
      {layers.map(layer => (
        <div key={layer.zIndex} style={layerStyle(layer.zIndex, layer.blur, layer.mask)}></div>
      ))}
    </div>
  );
}

export default GradientBlur;