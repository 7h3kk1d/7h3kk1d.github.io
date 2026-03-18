import React, { useState, useRef, useEffect } from 'react'
import { useStaticQuery, graphql, Link } from 'gatsby'

const Search = () => {
  const data = useStaticQuery(graphql`
    query SearchIndexQuery {
      allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
        nodes {
          frontmatter {
            title
            date(formatString: "YYYY/MM/DD")
            tags
          }
          fields {
            slug
          }
          excerpt(pruneLength: 200)
        }
      }
    }
  `)

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const posts = data.allMarkdownRemark.nodes

  const results =
    query.length > 0
      ? posts.filter((post) => {
          const q = query.toLowerCase()
          const title = (post.frontmatter.title || '').toLowerCase()
          const excerpt = (post.excerpt || '').toLowerCase()
          const tags = (post.frontmatter.tags || []).map((t) => t.toLowerCase())
          return (
            title.includes(q) ||
            excerpt.includes(q) ||
            tags.some((t) => t.includes(q))
          )
        })
      : []

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      e.target.blur()
    }
  }

  return (
    <li className="search" ref={containerRef}>
      <input
        type="text"
        className="search-input"
        placeholder="Search..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => query.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label="Search posts"
      />
      {isOpen && query.length > 0 && (
        <ul className="search-results">
          {results.length > 0 ? (
            results.map((post) => (
              <li key={post.fields.slug} className="search-result-item">
                <Link
                  to={post.fields.slug}
                  onClick={() => {
                    setIsOpen(false)
                    setQuery('')
                  }}
                >
                  <span className="search-result-title">
                    {post.frontmatter.title}
                  </span>
                  <span className="search-result-date">
                    {post.frontmatter.date}
                  </span>
                </Link>
              </li>
            ))
          ) : (
            <li className="search-no-results">No results found</li>
          )}
        </ul>
      )}
    </li>
  )
}

export default Search
