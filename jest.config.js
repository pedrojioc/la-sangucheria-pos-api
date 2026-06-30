const tsJestConfig = [
  'ts-jest',
  {
    tsconfig: {
      esModuleInterop: true,
      allowSyntheticDefaultImports: true
    }
  }
]

// faker v10 and uuid v13 are pure ESM — ts-jest must transform them
// The negative lookahead must cover pnpm's nested path: .pnpm/uuid@13/node_modules/uuid
const transformIgnorePatterns = ['/node_modules/(?!uuid|@faker-js/faker|.*\\.pnpm/uuid|.*\\.pnpm/@faker-js\\+faker)']

const sharedModuleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
  '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  '^@core/(.*)$': '<rootDir>/src/core/$1',
  '^@test/(.*)$': '<rootDir>/tests/$1'
}

const sharedTransform = {
  '^.+\\.(t|j)s$': tsJestConfig
}

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/**/*.spec.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '<rootDir>/tests/e2e/'],
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      transform: sharedTransform,
      transformIgnorePatterns,
      testEnvironment: 'node',
      moduleNameMapper: sharedModuleNameMapper,
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!src/**/*.entity.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.request.ts',
        '!src/**/*.response.ts',
        '!src/**/*.command.ts',
        '!src/**/*.query.ts',
        '!src/**/migrations/**'
      ],
      coverageDirectory: './coverage'
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.e2e-spec.ts'],
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      transform: sharedTransform,
      transformIgnorePatterns,
      testEnvironment: 'node',
      moduleNameMapper: sharedModuleNameMapper
    }
  ]
}
