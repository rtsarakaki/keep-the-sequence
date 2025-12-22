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
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = 0;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const goToSlide = (index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const slideWidth = container.offsetWidth || container.clientWidth;
    const targetScroll = index * slideWidth;
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
    setCurrentIndex(index);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    const container = containerRef.current;
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    container.style.cursor = 'grabbing';
    container.style.scrollSnapType = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const container = containerRef.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    setIsDragging(false);
    container.style.cursor = 'grab';
    container.style.scrollSnapType = 'x mandatory';
    
    // Snap to nearest slide
    const slideWidth = container.offsetWidth || container.clientWidth;
    const scrollPosition = container.scrollLeft;
    const newIndex = Math.round(scrollPosition / slideWidth);
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    goToSlide(clampedIndex);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    container.style.scrollSnapType = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const container = containerRef.current;
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    setIsDragging(false);
    container.style.scrollSnapType = 'x mandatory';
    
    // Snap to nearest slide
    const slideWidth = container.offsetWidth || container.clientWidth;
    const scrollPosition = container.scrollLeft;
    const newIndex = Math.round(scrollPosition / slideWidth);
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    goToSlide(clampedIndex);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isDragging) return;
      const slideWidth = container.offsetWidth || container.clientWidth;
      if (slideWidth === 0) return; // Container not ready
      const scrollPosition = container.scrollLeft;
      const newIndex = Math.round(scrollPosition / slideWidth);
      const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
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
