import { useState, useRef, useEffect } from 'react'

interface Post {
  title: string
  date: string
  tags: string[]
  slug: string
  excerpt: string
}

const Search = ({ posts }: { posts: Post[] }) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLLIElement>(null)

  const results =
    query.length > 0
      ? posts.filter((post) => {
          const q = query.toLowerCase()
          const title = (post.title || '').toLowerCase()
          const excerpt = (post.excerpt || '').toLowerCase()
          const tags = (post.tags || []).map((t) => t.toLowerCase())
          return (
            title.includes(q) ||
            excerpt.includes(q) ||
            tags.some((t) => t.includes(q))
          )
        })
      : []

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      ;(e.target as HTMLInputElement).blur()
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
              <li key={post.slug} className="search-result-item">
                <a
                  href={post.slug}
                  onClick={() => {
                    setIsOpen(false)
                    setQuery('')
                  }}
                >
                  <span className="search-result-title">{post.title}</span>
                  <span className="search-result-date">{post.date}</span>
                </a>
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
