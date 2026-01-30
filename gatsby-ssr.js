/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/ssr-apis/
 */

const React = require('react')

// Prevent flash of default theme on page load
exports.onRenderBody = ({ setPreBodyComponents }) => {
  const themeInitScript = `
    (function() {
      function getInitialTheme() {
        const persistedTheme = window.localStorage.getItem('theme');
        const hasPersistedTheme = typeof persistedTheme === 'string';
        
        if (hasPersistedTheme) {
          return persistedTheme;
        }
        
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return systemPrefersDark ? 'dark' : 'light';
      }
      
      const theme = getInitialTheme();
      document.documentElement.setAttribute('data-theme', theme);
    })();
  `

  setPreBodyComponents([
    React.createElement('script', {
      key: 'theme-init',
      dangerouslySetInnerHTML: {
        __html: themeInitScript,
      },
    }),
  ])
}
