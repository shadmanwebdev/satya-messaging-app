const theme = {
  // Colors
  colors: {
    primary: 'rgb(0, 79, 66)',
    secondary: 'rgb(255, 255, 255)',
    tertiary: 'rgb(244, 206, 20)',
    primaryLight: '#008c751a',
    
    text: {
      dark: '#242529',
      gray: '#777',
      gray2: '#666',
      gray3: '#bfbfbf',
    },
    
    background: {
      gray: '#efefef',
    },
    
    border: {
      primary: '#dbdbdb',
      messaging: '#e0e0e0',
      messaging2: '#8b8b8b',
    },
    
    button: {
      disabled: '#8f8f8f',
      save: '#B39DDB',
      edit: '#EFC53F',
      delete: '#FF5252',
    },
    
    star: {
      filled: 'rgb(255, 181, 0)',
      empty: 'rgb(255, 181, 0)',
    },
  },
  
  // Spacing and sizes
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Border radii
  borderRadius: {
    external: 16,
    external2: 8,
    button: 50,
    card: 8,
  },
  
  // Elevations for Android shadows
  elevation: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
    xxl: 16,
    
    // Component-specific elevations
    card: 2,
    button: 4,
    modal: 8,
    fab: 6,        // Floating Action Button
    appBar: 4,
    drawer: 16,
  },
};

export default theme;
