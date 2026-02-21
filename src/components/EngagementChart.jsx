import { useState, useEffect, useRef } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { facebookAPI } from '../services/supabaseApi'

const ERIO_FACEBOOK_URL = 'https://www.facebook.com/p/UIC-External-Relations-and-Internationalization-Office-100071237296359/'
const ERIO_PAGE_NAME = 'UIC External Relations and Internationalization Office'
const FACEBOOK_EMBED_SRC = 'https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fp%2FUIC-External-Relations-and-Internationalization-Office-100071237296359%2F&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true'

function relativeTime(isoDate) {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    const now = new Date()
    const sec = Math.floor((now - d) / 1000)
    if (sec < 60) return 'Just now'
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
    if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`
    if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  } catch {
    return isoDate
  }
}

function PostCard({ post }) {
  const [expanded, setExpanded] = useState(false)
  const message = post.message || 'View post on Facebook'
  const isLong = message.length > 200
  const displayMessage = expanded || !isLong ? message : message.slice(0, 200).trim() + (message.length > 200 ? '...' : '')
  const pictures = post.pictures?.length ? post.pictures : (post.picture ? [post.picture] : [])

  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-gray-200/80 bg-white/90 shadow-sm hover:shadow-md transition-all text-left group"
    >
      {/* Post header: avatar + page name + time */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
          {ERIO_PAGE_NAME.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{ERIO_PAGE_NAME}</p>
          <p className="text-xs text-gray-500">{relativeTime(post.createdTime)}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-pink-500 flex-shrink-0" />
      </div>

      {/* Message */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
          {displayMessage}
          {isLong && !expanded && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(true) }}
              className="text-pink-600 font-medium ml-1 hover:underline"
            >
              See more
            </button>
          )}
        </p>
      </div>

      {/* Images: single or grid */}
      {pictures.length > 0 && (
        <div className={`grid gap-0.5 ${pictures.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {pictures.slice(0, 4).map((src, i) => (
            <div
              key={i}
              className={`aspect-video bg-gray-100 ${pictures.length === 1 ? '' : 'min-h-[120px]'}`}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </a>
  )
}

export default function EngagementChart() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEmbedFallback, setShowEmbedFallback] = useState(false)
  const embedRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await facebookAPI.getPosts()
        if (!cancelled && Array.isArray(data)) setPosts(data)
      } catch (_) {
        if (!cancelled) setPosts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // When no posts from API, show embed after a short delay (lazy when in view)
  useEffect(() => {
    if (loading || posts.length > 0) return
    const timer = setTimeout(() => setShowEmbedFallback(true), 800)
    return () => clearTimeout(timer)
  }, [loading, posts.length])

  // Lazy-load iframe only when embed fallback is shown and container is in view
  const [embedVisible, setEmbedVisible] = useState(false)
  useEffect(() => {
    if (!showEmbedFallback || !embedRef.current) return
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setEmbedVisible(true) },
      { rootMargin: '80px', threshold: 0.1 }
    )
    observer.observe(embedRef.current)
    return () => observer.disconnect()
  }, [showEmbedFallback])

  return (
    <div className="glass-card rounded-3xl p-6 md:p-7 shadow-glass">
      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 tracking-tight">Engagement Updates</h3>
      <p className="text-sm text-gray-600 mb-4">
        Live updates from the External Relations and Internationalization Office Facebook page.
      </p>

      {loading ? (
        <div className="flex items-center justify-center gap-2 h-[200px] rounded-2xl bg-gray-100/50 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading posts…</span>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <a
            href={ERIO_FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-pink-600 hover:text-pink-700"
          >
            View more on Facebook
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div ref={embedRef} className="w-full h-[500px] md:h-[520px] overflow-hidden rounded-2xl bg-gray-100/50">
          {showEmbedFallback && embedVisible ? (
            <iframe
              title="ERIO Facebook Feed"
              src={FACEBOOK_EMBED_SRC}
              style={{ border: 'none', overflow: 'hidden', width: '100%', height: '100%' }}
              scrolling="yes"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          ) : showEmbedFallback ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              Loading Facebook feed…
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              Loading…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
