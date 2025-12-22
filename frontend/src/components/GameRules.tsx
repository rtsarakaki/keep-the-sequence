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

  return (
    <div className={styles.rules}>
      <h2 className={styles.rulesTitle}>Como Jogar</h2>
      <div className={styles.rulesGrid}>
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

