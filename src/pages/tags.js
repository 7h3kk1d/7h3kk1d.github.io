import React from 'react'
import { Link, graphql } from 'gatsby'
import Layout from '../components/layout'
import { rhythm } from '../utils/typography'

// Helper function to convert tag to URL-friendly slug
const kebabCase = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')

const TagsPage = ({ data }) => {
  const group = data.allMarkdownRemark.group

  return (
    <Layout title="Tags">
      <div>
        <h1>All Tags</h1>
        <div className="tags-container" style={{ marginTop: rhythm(1) }}>
          {group.map((tag) => (
            <Link
              key={tag.fieldValue}
              to={`/tags/${kebabCase(tag.fieldValue)}/`}
              className="tag"
            >
              {tag.fieldValue} ({tag.totalCount})
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default TagsPage

export const query = graphql`
  query TagsQuery {
    allMarkdownRemark {
      group(field: { frontmatter: { tags: SELECT } }) {
        fieldValue
        totalCount
      }
    }
  }
`
