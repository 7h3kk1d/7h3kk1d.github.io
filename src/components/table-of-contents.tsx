import { useState, useEffect, useCallback, useMemo } from 'react'

interface Heading {
  depth: number
  slug: string
  text: string
}

interface NestedHeading {
  depth: number
  id: string
  value: string
  children: { depth: number; id: string; value: string }[]
}

const buildNestedHeadings = (headings: Heading[]): NestedHeading[] => {
  const nested: NestedHeading[] = []
  let currentSection: NestedHeading | null = null

  headings.forEach((heading) => {
    const text = heading.text.replace(/^#\s*/, '')
    const item = { depth: heading.depth, id: heading.slug, value: text }
    if (heading.depth === 2) {
      currentSection = { ...item, children: [] }
      nested.push(currentSection)
    } else if (heading.depth === 3 || heading.depth === 4) {
      if (currentSection) {
        currentSection.children.push(item)
      } else {
        nested.push({ ...item, children: [] })
      }
    }
  })

  return nested
}

const findActiveSection = (
  nestedHeadings: NestedHeading[],
  activeId: string
) => {
  for (const section of nestedHeadings) {
    if (section.id === activeId) return section.id
    for (const child of section.children) {
      if (child.id === activeId) return section.id
    }
  }
  return null
}

const TableOfContents = ({
  headings,
  title,
  hasComments,
}: {
  headings: Heading[]
  title: string
  hasComments: boolean
}) => {
  const [activeId, setActiveId] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  const nestedHeadings = useMemo(
    () => buildNestedHeadings(headings),
    [headings]
  )
  const activeSectionId = useMemo(
    () => findActiveSection(nestedHeadings, activeId),
    [nestedHeadings, activeId]
  )

  useEffect(() => {
    setMounted(true)

    const headingElements = document.querySelectorAll('h2[id], h3[id], h4[id]')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    )

    headingElements.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [])

  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      window.history.pushState(null, '', `#${id}`)
      setActiveId(id)
      setIsExpanded(false)
    }
  }, [])

  if (!mounted || !headings || headings.length === 0) {
    return null
  }

  return (
    <aside
      className={`toc-container ${isExpanded ? 'toc-container--expanded' : ''}`}
    >
      <button
        className="toc-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="toc-nav"
      >
        <span>Table of Contents</span>
        <svg
          className={`toc-toggle__chevron ${
            isExpanded ? 'toc-toggle__chevron--expanded' : ''
          }`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <nav id="toc-nav" className="toc" aria-label="Table of contents">
        <h4 className="toc__title">
          <a
            href="#post-title"
            className="toc__link"
            onClick={(e) => handleClick(e, 'post-title')}
          >
            {title}
          </a>
        </h4>
        <ul className="toc__list">
          {nestedHeadings.map((section) => {
            const isSectionActive = activeSectionId === section.id
            const hasChildren = section.children.length > 0

            return (
              <li key={section.id} className="toc__section">
                <a
                  href={`#${section.id}`}
                  className={`toc__link toc__link--depth-${section.depth} ${
                    activeId === section.id ? 'toc__link--active' : ''
                  }`}
                  onClick={(e) => handleClick(e, section.id)}
                >
                  {section.value}
                </a>
                {hasChildren && (
                  <ul
                    className={`toc__sublist ${
                      isSectionActive ? 'toc__sublist--expanded' : ''
                    }`}
                  >
                    {section.children.map((child) => (
                      <li
                        key={child.id}
                        className={`toc__item toc__item--depth-${child.depth}`}
                      >
                        <a
                          href={`#${child.id}`}
                          className={`toc__link toc__link--depth-${
                            child.depth
                          } ${
                            activeId === child.id ? 'toc__link--active' : ''
                          }`}
                          onClick={(e) => handleClick(e, child.id)}
                        >
                          {child.value}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
          {hasComments && (
            <li className="toc__section">
              <a
                href="#comments"
                className={`toc__link toc__link--depth-2 ${
                  activeId === 'comments' ? 'toc__link--active' : ''
                }`}
                onClick={(e) => handleClick(e, 'comments')}
              >
                Comments
              </a>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  )
}

export default TableOfContents
