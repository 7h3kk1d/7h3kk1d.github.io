module.exports = {
  siteMetadata: {
    title: 'Alexander Bandukwala',
    description: 'Alexander Bandukwala\'s personal website'
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `content`,
        path: `${__dirname}/content/`,
      },
    },
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography.js`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-highlight-code`,
            options: {lineNumbers: true}
          },
        ],
      },
    },
  ],
}
