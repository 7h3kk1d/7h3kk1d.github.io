import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { unified } from '@astrojs/markdown-remark'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

export default defineConfig({
  site: 'https://bandukwala.me',
  // v7 defaults to JSX whitespace rules, which drop the line breaks that
  // separate inline text from links in these pages. `true` keeps Astro's
  // lossless HTML compression instead.
  compressHTML: true,
  integrations: [react(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'solarized-light',
        dark: 'one-dark-pro',
      },
    },
    processor: unified({
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'prepend',
            properties: {
              className: ['heading-anchor'],
              ariaHidden: true,
              tabIndex: -1,
            },
            content: {
              type: 'element',
              tagName: 'span',
              properties: { className: ['anchor-icon'] },
              children: [{ type: 'text', value: '#' }],
            },
          },
        ],
      ],
    }),
  },
})
