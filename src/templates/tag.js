import React from 'react'
import { Link } from 'gatsby-link'
import { rhythm } from '../utils/typography'
import Layout from '../components/layout'
import { graphql } from 'gatsby'

const TagTemplate = ({ pageContext, data }) => {
  const { tag } = pageContext
  const { edges, totalCount } = data.allMarkdownRemark
  const tagHeader = `${totalCount} post${
    totalCount === 1 ? '' : 's'
  } tagged with "${tag}"`

  return (
    <Layout title={tag}>
      <div>
        <h1>{tagHeader}</h1>
        <Link to="/tags" className="all-tags-link">
          ← All tags
        </Link>
        <div style={{ marginTop: rhythm(1) }}>
          {edges.map(({ node }) => (
            <div key={node.id}>
              <Link
                to={node.fields.slug}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3
                  style={{
                    marginBottom: rhythm(1 / 8),
                    marginTop: rhythm(1.25),
                  }}
                >
                  {node.frontmatter.title}{' '}
                  <span style={{ color: 'lightgray' }}>
                    - {node.frontmatter.date}
                  </span>
                </h3>
                <p>{node.excerpt}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default TagTemplate

export const query = graphql`
  query TagQuery($tag: String!) {
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      totalCount
      edges {
        node {
          id
          frontmatter {
            title
            date(formatString: "YYYY/MM/DD")
          }
          fields {
            slug
          }
          excerpt
        }
      }
    }
  }
`
