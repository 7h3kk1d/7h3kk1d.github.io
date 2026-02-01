const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

// Helper function to convert tag to URL-friendly slug
const kebabCase = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const result = await graphql(`
    {
      allMarkdownRemark {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              tags
            }
          }
        }
      }
    }
  `)

  // Create blog post pages
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    createPage({
      path: node.fields.slug,
      component: path.resolve(`./src/templates/blog-post.js`),
      context: {
        slug: node.fields.slug,
      },
    })
  })

  // Collect all unique tags
  const tags = new Set()
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    if (node.frontmatter.tags) {
      node.frontmatter.tags.forEach((tag) => tags.add(tag))
    }
  })

  // Create a page for each tag
  tags.forEach((tag) => {
    createPage({
      path: `/tags/${kebabCase(tag)}/`,
      component: path.resolve(`./src/templates/tag.js`),
      context: {
        tag,
      },
    })
  })
}
