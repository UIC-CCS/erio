import express from 'express'

const router = express.Router()

router.get('/posts', async (req, res) => {
  try {
    const pageId = '100071237296359'
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

    if (!accessToken) {
      return res.json({ posts: [] })
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?access_token=${accessToken}&fields=message,created_time,full_picture,permalink_url&limit=5`
    )

    if (!response.ok) {
      console.debug('Facebook API error:', response.statusText)
      return res.json({ posts: [] })
    }

    const data = await response.json()
    res.json({ posts: data.data || [] })
  } catch (error) {
    console.debug('Facebook posts fetch error:', error?.message)
    res.json({ posts: [] })
  }
})

export default router
