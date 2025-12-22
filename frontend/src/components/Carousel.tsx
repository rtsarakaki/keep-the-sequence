'use client';

import { useState, ReactNode } from 'react';
import styles from './Carousel.module.css';

interface CarouselProps {
  items: ReactNode[];
  showIndicators?: boolean;
  showNavigation?: boolean;
  className?: string;
}

export default function Carousel({
  items,
  showIndicators = true,
  showNavigation = true,
  className = '',
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.carousel} ${className}`}>
      {showNavigation && (
        <button
          className={styles.carouselButton}
          onClick={goToPrevious}
          aria-label="Item anterior"
        >
          ‹
        </button>
      )}

      <div className={styles.carouselContainer}>
        <div
          className={styles.carouselTrack}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={index} className={styles.carouselSlide}>
              {item}
            </div>
          ))}
        </div>
      </div>

      {showNavigation && (
        <button
          className={styles.carouselButton}
          onClick={goToNext}
          aria-label="Próximo item"
        >
          ›
        </button>
      )}

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

