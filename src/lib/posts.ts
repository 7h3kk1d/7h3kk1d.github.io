import { getCollection, type CollectionEntry } from 'astro:content'

export type Post = CollectionEntry<'blog'>

/** The URL segment for a tag: `/tags/<tagSlug(tag)>/`. */
export const tagSlug = (tag: string) =>
  tag
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')

export const tagUrl = (tag: string) => `/tags/${tagSlug(tag)}/`

/** Every post, newest first. */
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog')
  return posts.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  )
}

/** Each tag used by `posts` with how many of them use it, alphabetically. */
export function countTags(posts: Post[]): [tag: string, count: number][] {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b))
}
