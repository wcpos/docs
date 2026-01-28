module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/scripts/__tests__/**/*.test.js'],
  // Don't transform scripts - they're plain CommonJS
  transform: {},
  // Ignore Docusaurus source files
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/docs/'],
};
