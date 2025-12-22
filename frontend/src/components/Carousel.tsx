'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import styles from './Carousel.module.css';

interface CarouselProps {
  items: ReactNode[];
  showIndicators?: boolean;
  className?: string;
}

export default function Carousel({
  items,
  showIndicators = true,
  className = '',
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize scroll to first slide
  useEffect(() => {
    if (containerRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = 0;
        }
      });
    }
  }, []);

  const goToSlide = (index: number) => {
    if (containerRef.current) {
      const slideWidth = containerRef.current.offsetWidth;
      containerRef.current.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth',
      });
      setCurrentIndex(index);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.style.scrollSnapType = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    if (!containerRef.current) return;
    setIsDragging(false);
    containerRef.current.style.cursor = 'grab';
    containerRef.current.style.scrollSnapType = 'x mandatory';
    
    // Snap to nearest slide (tudo ou nada)
    const slideWidth = containerRef.current.offsetWidth;
    const scrollPosition = containerRef.current.scrollLeft;
    const newIndex = Math.round(scrollPosition / slideWidth);
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    goToSlide(clampedIndex);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    containerRef.current.style.scrollSnapType = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    if (!containerRef.current) return;
    setIsDragging(false);
    containerRef.current.style.scrollSnapType = 'x mandatory';
    
    // Snap to nearest slide (tudo ou nada)
    const slideWidth = containerRef.current.offsetWidth;
    const scrollPosition = containerRef.current.scrollLeft;
    const newIndex = Math.round(scrollPosition / slideWidth);
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    goToSlide(clampedIndex);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isDragging) return; // Don't update during drag
      const slideWidth = container.offsetWidth;
      const scrollPosition = container.scrollLeft;
      const newIndex = Math.round(scrollPosition / slideWidth);
      const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, items.length, isDragging]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.carousel} ${className}`}>
      <div
        ref={containerRef}
        className={styles.carouselContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.carouselTrack}>
          {items.map((item, index) => (
            <div key={index} className={styles.carouselSlide}>
              {item}
            </div>
          ))}
        </div>
      </div>

      {showIndicators && (
        <div className={styles.carouselIndicators}>
          {items.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                index === currentIndex ? styles.indicatorActive : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para item ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
