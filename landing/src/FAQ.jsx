import React, { useState } from 'react';
import './FAQ.css';

const faqs = [
  {
    question: 'What is fractional art investing?',
    answer: 'It allows you to buy a share of a high-value artwork, making it possible to invest in fine art without needing millions. You own a piece of the art, just like owning a stock in a company.'
  },
  {
    question: 'How is the art authenticated and stored?',
    answer: 'Every piece in our collection is authenticated by leading experts and stored in specialized, high-security facilities. Your investment is protected by both physical and digital security measures.'
  },
  {
    question: 'Can I sell my shares?',
    answer: 'Yes. We are building a secondary market that will allow you to trade your shares with other investors on our platform, providing liquidity for your investments.'
  },
  {
    question: 'What are the fees?',
    answer: 'We believe in transparency. We charge a small initial sourcing fee included in the share price. There are no hidden costs.'
  }
];

const FAQItem = ({ faq, index, activeIndex, setActiveIndex }) => {
  const isActive = index === activeIndex;

  return (
    <div className="faq-item" id="faq">
      <button className="faq-question" onClick={() => setActiveIndex(isActive ? null : index)}>
        <span>{faq.question}</span>
        {isActive ? (
          <div style={{ width: '10px', height: '2px', backgroundColor: 'black' }} />
        ) : (
          <div style={{ position: 'relative', width: '10px', height: '10px' }}>
            <div style={{ position: 'absolute', top: '4px', left: '0', width: '10px', height: '2px', backgroundColor: 'black' }} />
            <div style={{ position: 'absolute', top: '4px', left: '0', width: '10px', height: '2px', backgroundColor: 'black', transform: 'rotate(90deg)' }} />
          </div>
        )}
      </button>
      <div className={`faq-answer ${isActive ? 'active' : ''}`}>
        <p>{faq.answer}</p>
      </div>
    </div>
  );
};

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section className="faq-section">
      <div className="faq-container">
        <h2 className="faq-title">Frequently Asked<br />Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ; 