import { useState, useEffect } from 'react'
import { Plus, Trash2, Shield, KeyRound } from 'lucide-react'
import { adminAPI } from '../../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await adminAPI.listUsers()
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEmail('')
    setPassword('')
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEmail('')
    setPassword('')
  }

  const handleSave = async () => {
    if (!email.trim()) {
      alert('Please enter an email address.')
      return
    }
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters.')
      return
    }
    setSaving(true)
    try {
      const user = await adminAPI.createUser(email.trim(), password)
      setUsers([user, ...users])
      handleCancel()
    } catch (error) {
      alert(error.message || 'Error creating user.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, userEmail) => {
    if (!window.confirm(`Remove admin "${userEmail}"?`)) return
    try {
      await adminAPI.deleteUser(id)
      setUsers(users.filter((u) => u.id !== id))
    } catch (error) {
      alert(error.message || 'Error deleting user.')
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      alert('Please enter your current password.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      alert('New password must be at least 6 characters.')
      return
    }
    setChangingPassword(true)
    try {
      await adminAPI.changePassword(currentPassword, newPassword)
      alert('Password changed successfully.')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
    } catch (error) {
      alert(error.message || 'Error changing password.')
    } finally {
      setChangingPassword(false)
    }
  }

  const currentAdminId = localStorage.getItem('adminId')

  if (loading) {
    return (
      <div className="flex justify-center min-h-[400px] items-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-6 shadow-glass-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
              Admin Users
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-0.5">
              Manage administrators who can access the dashboard.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="glass-strong px-5 py-2.5 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg transition-glass flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl p-6 shadow-glass">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New admin user</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="admin@uic.edu.ph"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                placeholder="Min. 6 characters"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="glass-strong px-4 py-2 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="glass px-4 py-2 rounded-xl font-medium text-gray-700 hover:glass-strong"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {users.length === 0 && !showForm && (
          <p className="text-gray-500 text-center py-8">No admin users found.</p>
        )}
        {users.map((user) => (
          <div
            key={user.id}
            className="glass-card rounded-2xl p-5 shadow-glass"
          >
            <div className="flex gap-4 flex-wrap items-center">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">
                  {user.email}
                  {Number(user.id) === Number(currentAdminId) && (
                    <span className="ml-2 text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                      You
                    </span>
                  )}
                  {user.email === 'mis@uic.edu.ph' && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Created: {user.created_at}
                  {user.last_login && <> &middot; Last login: {user.last_login}</>}
                </div>
              </div>
              {Number(user.id) === Number(currentAdminId) ? (
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-3 py-2 rounded-lg glass hover:glass-strong text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Change Password
                </button>
              ) : user.email === 'mis@uic.edu.ph' ? null : (
                <button
                  onClick={() => handleDelete(user.id, user.email)}
                  className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:glass-strong text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {showPasswordForm && Number(user.id) === Number(currentAdminId) && (
              <div className="mt-4 pt-4 border-t border-white/30">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full glass px-4 py-2 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-pink-200/80"
                      placeholder="Min. 6 characters"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="glass-strong px-4 py-2 rounded-xl font-semibold text-white gradient-pink hover:shadow-glass-lg disabled:opacity-50"
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false)
                        setCurrentPassword('')
                        setNewPassword('')
                      }}
                      className="glass px-4 py-2 rounded-xl font-medium text-gray-700 hover:glass-strong"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
