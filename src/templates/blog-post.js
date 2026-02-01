import React from 'react'
import { Link } from 'gatsby-link'
import { rhythm } from '../utils/typography'
import Layout from '../components/layout'
import { graphql } from 'gatsby'

// Helper function to convert tag to URL-friendly slug
const kebabCase = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')

const blogPost = ({ data }) => {
  const post = data.markdownRemark
  const tags = post.frontmatter.tags || []
  return (
    <Layout title={post.frontmatter.title}>
      <div>
        <h1 style={{ display: `inline-block` }}>{post.frontmatter.title}</h1>
        <h4
          className="post-date"
          style={{
            marginBottom: rhythm(1 / 4),
            marginTop: rhythm(1 / 8),
          }}
        >
          {post.frontmatter.date}
        </h4>
        {tags.length > 0 && (
          <div className="tags" style={{ marginBottom: rhythm(1) }}>
            {tags.map((tag) => (
              <Link key={tag} to={`/tags/${kebabCase(tag)}/`} className="tag">
                {tag}
              </Link>
            ))}
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>
    </Layout>
  )
}
export default blogPost

export const query = graphql`
  query BlogPostQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        date(formatString: "DD MMMM, YYYY")
        tags
      }
    }
  }
`
