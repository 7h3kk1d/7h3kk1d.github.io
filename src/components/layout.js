import React from 'react'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import { Link } from 'gatsby-link'
import ThemeToggle from './theme-toggle'

const ListLink = (props) => (
  <li style={{ display: `inline-block`, marginRight: `1rem` }}>
    <Link to={props.to}>{props.children}</Link>
  </li>
)

const layout = ({ children, title }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
            description
          }
        }
      }
    `}
    render={(data) => (
      <>
        <div>
          <Helmet
            defaultTitle={data.site.siteMetadata.title}
            title={title}
            titleTemplate={`%s | ${data.site.siteMetadata.title}`}
            meta={[
              {
                name: 'description',
                content: data.site.siteMetadata.description,
              },
              { name: 'keywords', content: 'blog, programming' },
            ]}
          />
          <div
            style={{
              margin: '0 auto',
              maxWidth: 960,
              padding: '1.25rem 1rem',
            }}
          >
            <header style={{ marginBottom: '1.45rem', width: '100%' }}>
              <div>
                <Link
                  to="/"
                  style={{
                    textShadow: `none`,
                    backgroundImage: `none`,
                  }}
                >
                  <h3 style={{ display: `inline` }}>
                    {data.site.siteMetadata.title}
                  </h3>
                </Link>
                <ul
                  style={{
                    listStyle: `none`,
                    float: `right`,
                    display: 'flex',
                    alignItems: 'center',
                    margin: 0,
                  }}
                >
                  <ListLink to="/">Home</ListLink>
                  <ListLink to="/about">About</ListLink>
                  <ListLink to="/cv">CV</ListLink>
                  <ListLink to="https://twitter.com/abanduk">Twitter</ListLink>
                  <ListLink to="https://fosstodon.org/@thekkid">
                    Mastodon
                  </ListLink>
                  <ListLink to="https://github.com/7h3kk1d">GitHub</ListLink>
                  <ListLink to="mailto:alexander@bandukwala.me">Email</ListLink>
                  <li style={{ display: 'inline-block', marginLeft: '1rem' }}>
                    <ThemeToggle />
                  </li>
                </ul>
              </div>
            </header>
            {children}
          </div>
        </div>
      </>
    )}
  />
)
export default layout
