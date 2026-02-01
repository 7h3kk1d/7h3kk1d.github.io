import React, { useEffect, useState } from 'react'
import { BlueskyComments } from 'bluesky-comments'
import 'bluesky-comments/bluesky-comments.css'

const BlueskyCommentsSection = ({ postUri }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Return nothing if no URI provided
  if (!postUri) {
    return null
  }

  // SSR guard: only render on client
  if (!isClient) {
    return null
  }

  return (
    <section className="bluesky-comments-section">
      <h2>Comments</h2>
      <p className="bluesky-comments-cta">
        Join the conversation by{' '}
        <a href={postUri} target="_blank" rel="noopener noreferrer">
          replying on Bluesky
        </a>
        .
      </p>
      <BlueskyComments
        uri={postUri}
        author="bandukwala.me"
        onEmpty={() => (
          <p className="bluesky-comments-empty">
            No comments yet. Be the first to reply on Bluesky!
          </p>
        )}
      />
    </section>
  )
}

export default BlueskyCommentsSection
