'use client';

import { useState } from 'react';
import styles from './GameRules.module.css';

export default function GameRules() {
  const rules = [
    {
      number: 1,
      title: 'Objetivo',
      description: 'Jogue todas as 98 cartas nas 4 pilhas antes que o baralho acabe.',
    },
    {
      number: 2,
      title: 'Pilhas',
      description: 'Duas pilhas crescentes (1→99) e duas decrescentes (100→2).',
    },
    {
      number: 3,
      title: 'Regra Especial',
      description: 'Você pode jogar uma carta 10 unidades menor/maior que a última.',
    },
    {
      number: 4,
      title: 'Comunicação',
      description: 'Vocês só podem se comunicar através das jogadas. Sem palavras!',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? rules.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === rules.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={styles.rules}>
      <h2 className={styles.rulesTitle}>Como Jogar</h2>
      
      <div className={styles.carousel}>
        <button
          className={styles.carouselButton}
          onClick={goToPrevious}
          aria-label="Regra anterior"
        >
          ‹
        </button>

        <div className={styles.carouselContainer}>
          <div
            className={styles.carouselTrack}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {rules.map((rule) => (
              <div key={rule.number} className={styles.carouselSlide}>
                <div className={styles.ruleCard}>
                  <div className={styles.ruleNumber}>{rule.number}</div>
                  <h3>{rule.title}</h3>
                  <p>{rule.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className={styles.carouselButton}
          onClick={goToNext}
          aria-label="Próxima regra"
        >
          ›
        </button>
      </div>

      <div className={styles.carouselIndicators}>
        {rules.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${
              index === currentIndex ? styles.indicatorActive : ''
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir para regra ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
