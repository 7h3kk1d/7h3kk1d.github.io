---
title: 'Continuous Delivery'
date: '2020-03-29'
---

Seems as if I only have time to write a post after major lifestyle changes. Working from home due to COVID-19 has presented me with a bit of time to worok on some personal projects (this blog include). So the first thing I did was update the blog to gatsby v2 which was mostly mechanical dependency updates and a few major breaking changes documented [here](https://www.gatsbyjs.org/docs/migrating-from-v1-to-v2/).

The next goal in order to speed up development is to get some form of CI/CD set up because I was manually deploying this every time I would tweak something or even add a new post. Since this site is hosted on [GitHub Pages](https://pages.github.com/) I decided it would probably be best to implement CD using [GitHub Actions](https://github.com/features/actions). Luckily there is already an action created to autopublish Gatsby sites to GitHub Pages [here](https://github.com/marketplace/actions/gatsby-publish). So hopefully now that the dev workflow is quicker I will be able to update more often.
