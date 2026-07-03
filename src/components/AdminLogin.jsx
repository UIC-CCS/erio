import { useState } from 'react'
import { LogIn, Lock, User, X, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../services/api'

export default function AdminLogin({ onClose, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authAPI.login(username, password)
      localStorage.setItem('adminAuthenticated', 'true')
      localStorage.setItem('adminLoginTime', Date.now().toString())
      localStorage.setItem('adminEmail', response.admin.email)
      setIsLoading(false)
      onLogin?.()
    } catch (err) {
      setError(err.message || 'Invalid email or password')
      setIsLoading(false)
    }
  }

  const handleClose = () => onClose?.()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop only – current page (dashboard/map) stays visible behind blur */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* Modal card – same structure and classes as preview.html */}
      <div className="glass-card rounded-3xl p-8 md:p-10 shadow-glass-lg max-w-md w-full mx-4 relative z-10">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 w-11 h-11 rounded-full glass-card flex items-center justify-center hover:glass-strong transition-glass shadow-glass-sm text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/80 flex items-center justify-center shadow-glass-sm">
            <Lock className="w-10 h-10 text-pink-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Login</h1>
          <p className="text-gray-600">Access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass px-4 pl-12 py-3 rounded-2xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-200/80 transition-glass"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass px-4 pl-12 pr-12 py-3 rounded-2xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-200/80 transition-glass"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="glass-card rounded-xl p-4 bg-red-50/50 border border-red-200/50">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full glass-strong rounded-2xl py-3.5 px-6 font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
