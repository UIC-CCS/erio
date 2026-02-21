// Fetches public posts from the ERIO Facebook page via Graph API.
// Set secret: supabase secrets set FACEBOOK_PAGE_ACCESS_TOKEN=your_token
// Token: Page token or App token with pages_read_engagement for page 100071237296359

const FACEBOOK_PAGE_ID = '100071237296359'
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const token = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN')
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Facebook token not configured', posts: [] }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const url = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/posts?fields=id,message,created_time,full_picture,permalink_url,story,attachments{media{image}}&limit=5&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data?.error?.message || 'Facebook API error', posts: [] }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const posts = (data?.data || []).map((p: {
      id: string
      message?: string
      created_time?: string
      full_picture?: string
      permalink_url?: string
      story?: string
      attachments?: { data?: Array<{ media?: { image?: { src?: string } }; subattachments?: { data?: Array<{ media?: { image?: { src?: string } } }> } }> }
    }) => {
      const pictures: string[] = []
      if (p.full_picture) pictures.push(p.full_picture)
      const att = p.attachments?.data
      if (att?.length) {
        for (const a of att) {
          if (a.media?.image?.src) pictures.push(a.media.image.src)
          for (const sub of a.subattachments?.data || []) {
            if (sub.media?.image?.src) pictures.push(sub.media.image.src)
          }
        }
      }
      return {
        id: p.id,
        message: p.message || p.story || '',
        createdTime: p.created_time,
        picture: p.full_picture || null,
        pictures: pictures.length ? pictures : (p.full_picture ? [p.full_picture] : []),
        link: p.permalink_url || `https://www.facebook.com/${p.id}`,
      }
    })

    return new Response(JSON.stringify({ posts }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to fetch posts', posts: [] }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
