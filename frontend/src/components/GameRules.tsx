'use client';

import gameRules from '@/data/gameRules.json';
import styles from './GameRules.module.css';

export default function GameRules() {
  const rules = gameRules;

  return (
    <div className={styles.rules}>
      <h2 className={styles.rulesTitle}>Como Jogar</h2>
      <div className={styles.rulesScroll}>
        {rules.map((rule) => (
          <div key={rule.number} className={styles.ruleCard}>
            <div className={styles.ruleNumber}>{rule.number}</div>
            <h3>{rule.title}</h3>
            <p>{rule.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
