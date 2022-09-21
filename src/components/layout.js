import React from 'react'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from "gatsby"
import Link from 'gatsby-link'

const ListLink = props =>
  <li style={{ display: `inline-block`, marginRight: `1rem` }}>
    <Link to={props.to}>
      {props.children}
    </Link>
  </li>

export default ({ children }) => (
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
    render={data => (
      <>
        <div>
          <Helmet
            title={data.site.siteMetadata.title}
            meta={[
              { name: 'description', content: data.site.siteMetadata.description },
              { name: 'keywords', content: 'blog, programming' },
            ]}
          />
          <div
            style={{
              margin: '0 auto',
              maxWidth: 960,
              padding: '1.25rem 1rem',
            }}>
            <header style={{ marginBottom: '1.45rem', width: '100%' }} >
              <div>
                <Link
                  to="/"
                  style={{
                    textShadow: `none`,
                    backgroundImage: `none`
                  }}
                >
                  <h3 style={{ display: `inline` }}>{data.site.siteMetadata.title}</h3>
                </Link>
                <ul style={{ listStyle: `none`, float: `right` }}>
                  <ListLink to="/">Home</ListLink>
                  <ListLink to="/about">About</ListLink>
                  <a href="https://twitter.com/abanduk" style={{background: `none`}}><img alt={`Twitter Profile`} style={{ verticalAalign: `bottom`, marginBottom: 0}}width={25} height={25} src={`/images/twitter.svg`} /></a>
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