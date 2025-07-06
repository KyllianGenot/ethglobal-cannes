import './App.css'
import { useEffect, useRef, useState } from 'react'

function App() {
  const monalisaRef = useRef(null)
  const artworkContainerRef = useRef(null)
  const artwork5StaticRef = useRef(null)
  const artwork5ScrollingRef = useRef(null)
  const artworkScrollRef = useRef(null)
  const maxProgressRef = useRef(0)
  const maxScrollRef = useRef(350)
  const [keyframes, setKeyframes] = useState('');
  const [initialTop, setInitialTop] = useState(null);

  useEffect(() => {
    if (monalisaRef.current) {
      setInitialTop(monalisaRef.current.offsetTop);
    }
  }, []);

  useEffect(() => {
    const calculateScroll = () => {
      if (!artworkScrollRef.current || !artwork5ScrollingRef.current) {
        return;
      }

      if (initialTop !== null && artworkContainerRef.current) {
        const destinationTop = artworkContainerRef.current.parentElement.offsetTop
        maxScrollRef.current = destinationTop - initialTop
      }

      const scrollContainer = artworkScrollRef.current;
      const artwork5 = artwork5ScrollingRef.current;

      const viewportCenter = window.innerWidth / 2;
      const artwork5Center = artwork5.offsetLeft + artwork5.offsetWidth / 2;
      
      const initialTranslateX = viewportCenter - artwork5Center;
      
      const scrollDistance = scrollContainer.scrollWidth / 2;
      const endTranslateX = initialTranslateX - scrollDistance;

      scrollContainer.style.transform = `translateX(${initialTranslateX}px)`;

      const newKeyframes = `
        @keyframes scrollLeft {
          0% {
            transform: translateX(${initialTranslateX}px);
          }
          100% {
            transform: translateX(${endTranslateX}px);
          }
        }
      `;
      setKeyframes(newKeyframes);
    }
    
    const timer = setTimeout(calculateScroll, 100);
    window.addEventListener('resize', calculateScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateScroll);
    }
  }, [initialTop]);

  useEffect(() => {
    const handleScroll = () => {
      if (monalisaRef.current && artworkContainerRef.current && artwork5StaticRef.current && artwork5ScrollingRef.current && initialTop !== null) {
        const scrollY = window.scrollY
        const maxScroll = maxScrollRef.current
        
        const currentProgress = Math.min(scrollY / maxScroll, 1)
        
        if (currentProgress > maxProgressRef.current) {
          maxProgressRef.current = currentProgress
        }
        
        const progress = maxProgressRef.current
        
        const translateY = progress * maxScroll
        
        const initialRotation = -10
        const finalRotation = 0
        const currentRotation = initialRotation + (finalRotation - initialRotation) * progress
        
        monalisaRef.current.style.top = `${initialTop + translateY}px`
        monalisaRef.current.style.transform = `translateX(-50%) rotate(${currentRotation}deg)`
        
        // const finalTranslateY = 1 * maxScroll
        
        if (progress >= 1) {
          monalisaRef.current.style.opacity = '0';
          artwork5StaticRef.current.style.opacity = '0';
          artwork5ScrollingRef.current.style.opacity = '1';
          artworkContainerRef.current.classList.add('scrolling');
        } else {
          monalisaRef.current.style.opacity = '1';
          artwork5ScrollingRef.current.style.opacity = '0';
          artworkContainerRef.current.classList.remove('scrolling');

          artwork5StaticRef.current.style.opacity = progress > 1 ? '1' : '0';
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [initialTop])

  return (
    <>
      <style>{keyframes}</style>
      <div className='app'>
        <p style={{zIndex: 2}} className='app-undertitle'>ONCHAIN<br />GALLERY</p>
        <p style={{zIndex: 2}} className='app-title'>A GALErIE<br />FOr<br />DIGITAL ArTS</p>
        <p style={{zIndex: 2}} className='app-sort'>Balance<br /><span className="app-sort-s1">your space,</span><br /><span className="app-sort-s2">and</span><br /><span className="app-sort-s3">Tokenize<br />your vision.</span></p>
        <button style={{zIndex: 2}} className='app-shop-button'>SHOP NOW</button>
      </div>
      <img 
        ref={monalisaRef}
        src="/images/joconde.jpg" 
        alt="Mona Lisa, La Joconde"
        className='app-monalisa'
        style={{zIndex: 2}}
      />
      <section className='artworks-section' style={{ position: 'relative' }}>
        <div 
          ref={artworkContainerRef}
          className='artwork-container'
        >
          <div className='artwork-scroll' ref={artworkScrollRef}>
            <img src="/images/artwork1.webp" alt="Artwork 1" className='artwork-item' />
            <img src="/images/artwork2.jpeg" alt="Artwork 2" className='artwork-item' />
            <img src="/images/artwork3.jpg" alt="Artwork 3" className='artwork-item' />
            <img src="/images/artwork4.png" alt="Artwork 4" className='artwork-item' />
            <img 
              ref={artwork5ScrollingRef}
              src="/images/joconde.jpg" 
              alt="Artwork 5" 
              className='artwork-item' 
            />
            <img src="/images/artwork6.jpg" alt="Artwork 6" className='artwork-item' />
            <img src="/images/artwork7.jpg" alt="Artwork 7" className='artwork-item' />
            <img src="/images/artwork8.jpg" alt="Artwork 8" className='artwork-item' />
            <img src="/images/artwork9.png" alt="Artwork 9" className='artwork-item' />
            
            <img src="/images/artwork1.webp" alt="Artwork 1" className='artwork-item' />
            <img src="/images/artwork2.jpeg" alt="Artwork 2" className='artwork-item' />
            <img src="/images/artwork3.jpg" alt="Artwork 3" className='artwork-item' />
            <img src="/images/artwork4.png" alt="Artwork 4" className='artwork-item' />
            <img src="/images/joconde.jpg" alt="Artwork 5" className='artwork-item' />
            <img src="/images/artwork6.jpg" alt="Artwork 6" className='artwork-item' />
            <img src="/images/artwork7.jpg" alt="Artwork 7" className='artwork-item' />
            <img src="/images/artwork8.jpg" alt="Artwork 8" className='artwork-item' />
            <img src="/images/artwork9.png" alt="Artwork 9" className='artwork-item' />
          </div>
          <img
            ref={artwork5StaticRef}
            src="/images/joconde.jpg"
            alt="Artwork 5"
            className='artwork-item artwork-main'
          />
        </div>
      </section>
    </>
  )
}

export default App