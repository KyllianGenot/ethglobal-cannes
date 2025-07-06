import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Header from './Header.jsx'
import InfoSection from './InfoSection';
import HowItWorks from './HowItWorks';
import MarketPerformance from './MarketPerformance';
import FAQ from './FAQ';
import Footer from './Footer';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Header />
    <App />
    <InfoSection />
    <HowItWorks />
    <MarketPerformance />
    <FAQ />
    <Footer />
  </StrictMode>,
)