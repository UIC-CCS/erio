import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'erio.db')

async function seedAdmin() {
  const SQL = await initSqlJs()

  if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found at', DB_PATH)
    console.error('Start the API server first to generate it.')
    process.exit(1)
  }

  const buffer = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(buffer)

  const email = process.argv[2] || 'mis@uic.edu.ph'
  const password = process.argv[3] || 'mis2026pass!'
  const passwordHash = bcrypt.hashSync(password, 10)

  db.run(
    `INSERT INTO admin_users (email, password_hash)
     VALUES (?, ?)
     ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`,
    [email, passwordHash]
  )

  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))

  console.log(`Admin "${email}" seeded successfully.`)
  process.exit(0)
}

seedAdmin()
