import { useEffect } from 'react'

/**
 * SEOHead — updates <title> and meta tags per page.
 * Since this is a Vite SPA (no SSR), this helps with
 * client-side crawling and social sharing previews.
 */
export default function SEOHead({ title, description, canonical }) {
  useEffect(() => {
    // Title
    document.title = title

    // Description
    let desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', description)

    // Canonical
    let can = document.querySelector('link[rel="canonical"]')
    if (can) can.setAttribute('href', canonical)

    // OG
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', title)
    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', description)
    let ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', canonical)

    return () => {
      // Reset to default on unmount
      document.title = 'Green Earth Initiative — Earn Rewards for Eco-Friendly Activities'
    }
  }, [title, description, canonical])

  return null
}
