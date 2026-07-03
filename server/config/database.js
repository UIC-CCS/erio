import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'database', 'erio.db')

let db = null

export async function initDatabase() {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
    console.log('Loaded existing SQLite database')
  } else {
    db = new SQL.Database()
    console.log('Creating new SQLite database...')

    createTables()
    seedData()
    saveDb()
    console.log('SQLite database created and initialized')
  }

  return db
}

export function getDb() {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function saveDb() {
  if (db) {
    const data = db.export()
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  }
}

export function queryAll(sql, params = []) {
  const stmt = getDb().prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows.length > 0 ? rows[0] : null
}

export function run(sql, params = []) {
  getDb().run(sql, params)
  saveDb()
}

export function runWithLastId(sql, params = []) {
  getDb().run(sql, params)
  const result = getDb().exec('SELECT last_insert_rowid() as id')
  saveDb()
  return result[0].values[0][0]
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS dashboard_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_universities INTEGER NOT NULL DEFAULT 76,
      active_agreements INTEGER NOT NULL DEFAULT 65,
      student_exchanges INTEGER NOT NULL DEFAULT 892,
      events_this_year INTEGER NOT NULL DEFAULT 32,
      regional_distribution TEXT NOT NULL DEFAULT '{"asiaPacific":88,"europe":7,"americas":5}',
      programs_offered TEXT NOT NULL DEFAULT '{"exchange":68,"research":24,"summer":18}',
      engagement_score REAL NOT NULL DEFAULT 9.2,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS partner_universities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT,
      lat REAL,
      lng REAL,
      students INTEGER DEFAULT 0,
      programs TEXT DEFAULT '["Student Exchange"]',
      established TEXT,
      type TEXT DEFAULT 'Comprehensive',
      sign_date TEXT,
      expiry_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS program_offerings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_type TEXT NOT NULL,
      title TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS recent_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      place TEXT,
      event_date TEXT,
      short_description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS mobility_programmes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programme_name TEXT NOT NULL,
      programme_date TEXT,
      place TEXT,
      number_of_students INTEGER DEFAULT 0,
      type TEXT NOT NULL CHECK (type IN ('student_exchange', 'faculty_exchange')),
      direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS website_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      view_date TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `)

  db.run('CREATE INDEX IF NOT EXISTS idx_partner_country ON partner_universities(country)')
  db.run('CREATE INDEX IF NOT EXISTS idx_activity_date ON recent_activities(created_at DESC)')
  db.run('CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC)')
  db.run('CREATE INDEX IF NOT EXISTS idx_mobility_type ON mobility_programmes(type)')
  db.run('CREATE INDEX IF NOT EXISTS idx_mobility_direction ON mobility_programmes(direction)')
}

function seedData() {
  db.run(`
    INSERT OR IGNORE INTO dashboard_stats
      (partner_universities, active_agreements, student_exchanges, events_this_year,
       regional_distribution, programs_offered, engagement_score)
    VALUES (76, 65, 892, 32,
      '{"asiaPacific":88,"europe":7,"americas":5}',
      '{"exchange":68,"research":24,"summer":18}',
      9.2)
  `)

  const adminEmail = process.env.ADMIN_EMAIL || 'paung_230000001724@uic.edu.ph'
  const adminPassword = process.env.ADMIN_PASSWORD || 'erio2026pass!'
  const passwordHash = bcrypt.hashSync(adminPassword, 10)

  db.run(
    `INSERT OR IGNORE INTO admin_users (email, password_hash) VALUES (?, ?)`,
    [adminEmail, passwordHash]
  )

  const partners = [
    ['Universiti Teknologi Brunei', 'Brunei', 'Bandar Seri Begawan', 4.9031, 114.9398, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Royal University of Phnom Penh', 'Cambodia', 'Phnom Penh', 11.5564, 104.9282, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ["St. Mary's University of Calgary", 'Canada', 'Calgary', 51.0447, -114.0719, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['UMAP International Secretariat', 'Canada', 'Toronto', 43.6532, -79.3832, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Karelia University of Applied Sciences', 'Finland', 'Joensuu', 62.6010, 29.7636, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Sulkhan-Saba Orbeliani University', 'Georgia', 'Tbilisi', 41.7151, 44.8271, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['United Board for Higher Education in Asia', 'Hong Kong', 'Hong Kong', 22.3193, 114.1694, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Karpagam Academy of Higher Education', 'India', 'Coimbatore', 11.0168, 76.9558, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Sri Krishna Arts and Science College', 'India', 'Coimbatore', 11.0168, 76.9558, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Atma Jaya Catholic University of Indonesia', 'Indonesia', 'Jakarta', -6.2088, 106.8456, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Sekolah Menengah Kejuruan Muhammadiyah 3 Banjarmasin', 'Indonesia', 'Banjarmasin', -3.3194, 114.5911, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Ahmad Dalan', 'Indonesia', 'Yogyakarta', -7.7956, 110.3695, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Bengkulu', 'Indonesia', 'Bengkulu', -3.7928, 102.2608, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Jambi', 'Indonesia', 'Jambi', -1.6101, 103.6068, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Katolik Santo Thomas', 'Indonesia', 'Medan', 3.5952, 98.6722, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Katolik Widya Mandala Surabaya', 'Indonesia', 'Surabaya', -7.2575, 112.7521, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Katolik Widya Mandira', 'Indonesia', 'Kupang', -10.1772, 123.6070, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Kristen Indonesia', 'Indonesia', 'Jakarta', -6.2088, 106.8456, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Lambung Mangkurat', 'Indonesia', 'Banjarmasin', -3.3194, 114.5911, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Negeri Jakarta', 'Indonesia', 'Jakarta', -6.2088, 106.8456, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Negeri Malang', 'Indonesia', 'Malang', -7.9666, 112.6326, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Negeri Semarang', 'Indonesia', 'Semarang', -6.9667, 110.4167, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universitas Pendidikan Indonesia', 'Indonesia', 'Bandung', -6.9175, 107.6191, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Canvas Gate, Inc.', 'Japan', 'Tokyo', 35.6762, 139.6503, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Japan University of Economics', 'Japan', 'Fukuoka', 33.5904, 130.4017, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Josai International University', 'Japan', 'Togane', 35.5494, 140.3678, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Kansai University', 'Japan', 'Osaka', 34.6937, 135.5023, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Musashi University', 'Japan', 'Tokyo', 35.6762, 139.6503, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Osaka City University', 'Japan', 'Osaka', 34.6937, 135.5023, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['University of Tsukuba', 'Japan', 'Tsukuba', 36.1050, 140.1000, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['With The World', 'Japan', 'Tokyo', 35.6762, 139.6503, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Catholic University of Korea', 'Korea', 'Seoul', 37.5665, 126.9780, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['National University of Laos', 'Lao PDR', 'Vientiane', 17.9757, 102.6331, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['University of Saint Joseph', 'Macau', 'Macau', 22.1987, 113.5439, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['International Islamic University of Malaysia', 'Malaysia', 'Kuala Lumpur', 3.1390, 101.6869, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Management & Science University', 'Malaysia', 'Shah Alam', 3.0738, 101.5183, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universiti Kebangsaan Malaysia', 'Malaysia', 'Bangi', 2.9300, 101.7770, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universiti Kuala Lumpur', 'Malaysia', 'Kuala Lumpur', 3.1390, 101.6869, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universiti Malaya', 'Malaysia', 'Kuala Lumpur', 3.1201, 101.6544, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universiti Malaysia Sabah', 'Malaysia', 'Kota Kinabalu', 6.0329, 116.1180, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universiti Pendidikan Sultan Idris', 'Malaysia', 'Tanjung Malim', 3.6850, 101.5200, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universiti Sains Malaysia', 'Malaysia', 'Penang', 5.3533, 100.3019, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universiti Teknologi MARA', 'Malaysia', 'Shah Alam', 3.0738, 101.5183, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universiti Utara Malaysia', 'Malaysia', 'Sintok', 6.4697, 100.5060, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['University College of MAIWP International', 'Malaysia', 'Kuala Lumpur', 3.1390, 101.6869, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Kyaing Tong University', 'Myanmar', 'Kyaing Tong', 21.3014, 99.6080, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Nanyang Technological University', 'Singapore', 'Singapore', 1.3483, 103.6831, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Singapore University of Social Sciences', 'Singapore', 'Singapore', 1.2966, 103.7764, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Universidad Catolica San Antonio de Murcia', 'Spain', 'Murcia', 37.9922, -1.1307, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Chang Gung University of Science and Technology', 'Taiwan', 'Taoyuan', 25.0330, 121.5654, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Fu Jen Catholic University', 'Taiwan', 'New Taipei', 25.0330, 121.5654, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Kaohsiung Medical University', 'Taiwan', 'Kaohsiung', 22.6273, 120.3014, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['National Quemoy University', 'Taiwan', 'Kinmen', 24.4333, 118.3667, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Providence University', 'Taiwan', 'Taichung', 24.1477, 120.6736, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Southern Taiwan University of Science and Technology', 'Taiwan', 'Tainan', 22.9999, 120.2269, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['ASEAN University Network - Culture and Arts', 'Thailand', 'Bangkok', 13.7563, 100.5018, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['ASEAN University Network - Quality Assurance', 'Thailand', 'Bangkok', 13.7563, 100.5018, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Burapha University', 'Thailand', 'Chonburi', 13.3611, 100.9847, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Chiang Mai Rajabhat University', 'Thailand', 'Chiang Mai', 18.7883, 98.9853, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Chiang Rai Rajabhat University', 'Thailand', 'Chiang Rai', 19.9105, 99.8406, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Durajkit Pundit University', 'Thailand', 'Bangkok', 13.7563, 100.5018, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Huachiew Chalermprakiet University', 'Thailand', 'Samut Prakan', 13.5993, 100.5967, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ["King Mongkut's University of Technology Thonburi", 'Thailand', 'Bangkok', 13.6513, 100.4947, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['SEAMEO School Network', 'Thailand', 'Bangkok', 13.7563, 100.5018, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['SEAMEO SEA Teacher', 'Thailand', 'Bangkok', 13.7563, 100.5018, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['SEAMEO SEA TVET', 'Thailand', 'Bangkok', 13.7563, 100.5018, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Mahidol University', 'Thailand', 'Bangkok', 13.7899, 100.3245, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Pan-Asia International School', 'Thailand', 'Bangkok', 13.7563, 100.5018, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Valaya Alongkorn Rajabhat University', 'Thailand', 'Pathum Thani', 14.0208, 100.5250, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Global School Alliance', 'United Kingdom', 'London', 51.5074, -0.1278, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['University of Northampton', 'United Kingdom', 'Northampton', 52.2405, -0.9027, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['University of Central Missouri', 'USA', 'Warrensburg', 38.7631, -93.7365, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['University of Colorado Colorado Springs', 'USA', 'Colorado Springs', 38.8933, -104.8006, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['Dong Thap University', 'Vietnam', 'Cao Lanh', 10.4602, 105.6330, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['VNU-Ho Chi Minh City University of Social Sciences and Humanities', 'Vietnam', 'Ho Chi Minh City', 10.8231, 106.6297, 0, '["Student Exchange"]', null, 'Comprehensive'],
    ['University of Economics and Finance', 'Vietnam', 'Ho Chi Minh City', 10.8231, 106.6297, 0, '["Student Exchange"]', null, 'Comprehensive']
  ]

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO partner_universities
      (name, country, city, lat, lng, students, programs, established, type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const p of partners) {
    stmt.bind(p)
    stmt.step()
    stmt.reset()
  }
  stmt.free()
}
