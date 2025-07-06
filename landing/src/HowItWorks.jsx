import React from 'react';
import './HowItWorks.css';

// Importing images for the mosaic
import artwork1 from '/images/artwork1.webp';
import artwork2 from '/images/artwork2.jpeg';
import artwork3 from '/images/artwork3.jpg';
import artwork4 from '/images/artwork4.png';
import artwork5 from '/images/joconde.jpg';
import artwork6 from '/images/artwork6.jpg';
import artwork7 from '/images/artwork7.jpg';
import artwork8 from '/images/artwork8.jpg';
import artwork9 from '/images/artwork9.png';

const HowItWorks = () => {
  const steps = [
    {
      title: 'Create Your Account',
      description: 'Sign up in seconds—no wallet or crypto knowledge needed.'
    },
    {
      title: 'Fund Instantly',
      description: 'Add funds via card, bank transfer, or crypto. Your choice.'
    },
    {
      title: 'Buy Art Shares',
      description: 'Browse artworks and purchase fractions in just a few clicks.'
    }
  ];

  const images = [
    { src: artwork1, alt: 'Artwork 1' },
    { src: artwork2, alt: 'Artwork 2' },
    { src: artwork3, alt: 'Artwork 3' },
    { src: artwork4, alt: 'Artwork 4' },
    { src: artwork5, alt: 'Artwork 5' },
    { src: artwork6, alt: 'Artwork 6' },
    { src: artwork7, alt: 'Artwork 7' },
    { src: artwork8, alt: 'Artwork 8' },
    { src: artwork9, alt: 'Artwork 9' }
  ];

  return (
    <section className="how-it-works">
      <h2 className="how-it-works-title" id="how-it-works">How It Works</h2>
      <h3 className="how-it-works-undertitle">A simple and secure way to invest in art.</h3>
      <div className="how-it-works-content">
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <span className="step-number">{`${index + 1}`}</span>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mosaic-container">
          {images.map((image, index) => (
            <div key={index} className="mosaic-item">
              <img src={image.src} alt={image.alt} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 