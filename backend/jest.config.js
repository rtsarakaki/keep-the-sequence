module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    // Exclude presentation handlers (will be tested via integration tests)
    '!src/presentation/handlers/**/*.ts',
    // Exclude DI container (simple infrastructure code, tested indirectly via handlers)
    '!src/infrastructure/di/**/*.ts',
    // Exclude SQS Event Service (infrastructure code, will be tested via integration tests)
    '!src/infrastructure/sqs/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  verbose: true
};

