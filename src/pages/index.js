import React from 'react'
import { Link } from 'gatsby-link'
import { rhythm } from '../utils/typography'
import Layout from '../components/layout'
import { graphql } from 'gatsby'
import { about } from '../components/about'
import { research } from '../components/research'

// Helper function to convert tag to URL-friendly slug
const kebabCase = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')

const IndexPage = ({ data }) => (
  <Layout>
    <div>{about}</div>
    <div>{research}</div>
    <div>
      <h1>Posts</h1>
      {data.allMarkdownRemark.edges.map(({ node }) => (
        <div key={node.id}>
          <Link
            to={node.fields.slug}
            style={{ textDecoration: `none`, color: `inherit` }}
          >
            <h3
              style={{
                textDecoration: `none`,
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
          {node.frontmatter.tags && node.frontmatter.tags.length > 0 && (
            <div className="tags" style={{ marginTop: rhythm(-0.5) }}>
              {node.frontmatter.tags.map((tag) => (
                <Link key={tag} to={`/tags/${kebabCase(tag)}/`} className="tag">
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </Layout>
)

export const query = graphql`
  query IndexQuery {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      totalCount
      edges {
        node {
          id
          frontmatter {
            title
            date(formatString: "YYYY/MM/DD")
            tags
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
export default IndexPage
