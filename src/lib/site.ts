/** Values that describe the site itself, shared by the layout and the pages. */

export const siteTitle = 'Alexander Bandukwala'
export const siteDescription = "Alexander Bandukwala's personal website"

const emailHash =
  '676e09788c1fd1edcb6ee1d7dcd3de163f1d2613f0bb9c6b46ea73356545367a'

const avatar = (size: number) =>
  `https://gravatar.com/avatar/${emailHash}?s=${size}`

/** Shown on the homepage and the about page. */
export const avatarUrl = avatar(300)

/** Square, so social cards using it should ask for a `summary` layout. */
export const socialImageUrl = avatar(600)
export const socialImageAlt = `${siteTitle}'s profile picture`

export const twitterHandle = '@abanduk'
