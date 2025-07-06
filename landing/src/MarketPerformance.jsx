import React from 'react';
import './MarketPerformance.css';

const MarketPerformance = () => {
  return (
    <section className="market-performance">
      <div className="performance-content">
        <div className="performance-text">
          <h2 className="performance-title">A Smarter Way to Invest</h2>
          <p className="performance-description">
            Blue-chip art has historically outpaced the S&P 500 by an impressive 32%. In a market where Goldman Sachs predicts S&P returns of just 3% over the next decade, diversifying with alternatives is key. Our platform allows you to tap into this potential.
          </p>
          <div className="performance-graph">
            <img src="/images/graph.png" alt="Market Performance" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketPerformance;