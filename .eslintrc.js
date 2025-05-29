module.exports = {
  extends: ['expo', '@react-native-community'],
  rules: {
    'react-native/no-raw-text': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
  },
  env: {
    browser: true,
    es2021: true,
    'react-native/react-native': true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'react-native'],
};