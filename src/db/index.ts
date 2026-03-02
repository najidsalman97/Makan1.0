import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });

// Initialize DB with some dummy data if empty
const initDb = () => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      civil_id TEXT UNIQUE,
      moci_license_verified INTEGER NOT NULL DEFAULT 0,
      moci_license_number TEXT,
      license_expiry_date INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS immutable_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL REFERENCES payments(id),
      receipt_hash TEXT NOT NULL,
      pdf_url TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      landlord_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      paci_number TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS building_haris (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER NOT NULL REFERENCES buildings(id),
      haris_id INTEGER NOT NULL REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER NOT NULL REFERENCES buildings(id),
      unit_number TEXT NOT NULL,
      rent_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'vacant'
    );
    CREATE TABLE IF NOT EXISTS leases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL REFERENCES units(id),
      tenant_id INTEGER NOT NULL REFERENCES users(id),
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      is_executive_document INTEGER NOT NULL DEFAULT 0,
      lease_hash TEXT,
      cooling_off_end_date INTEGER NOT NULL,
      intent_to_withdraw INTEGER NOT NULL DEFAULT 0,
      intent_to_withdraw_date INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lease_id INTEGER NOT NULL REFERENCES leases(id),
      amount REAL NOT NULL,
      management_fee REAL NOT NULL DEFAULT 1.0,
      status TEXT NOT NULL DEFAULT 'pending',
      due_date INTEGER NOT NULL,
      paid_date INTEGER,
      knet_receipt_url TEXT
    );
    CREATE TABLE IF NOT EXISTS maintenance_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER NOT NULL REFERENCES buildings(id),
      unit_id INTEGER REFERENCES units(id),
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      description TEXT NOT NULL,
      image_url TEXT,
      ai_classification TEXT NOT NULL DEFAULT 'Pending',
      ai_confidence REAL,
      tenant_responsibility TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'open',
      latitude REAL,
      longitude REAL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS compliance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      consent_timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      ip_address TEXT NOT NULL,
      browser_fingerprint TEXT NOT NULL
    );
  `);

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN moci_license_number TEXT;`);
  } catch (e) {}
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN license_expiry_date INTEGER;`);
  } catch (e) {}

  // Insert superadmin
  sqlite.prepare('INSERT OR IGNORE INTO users (name, email, phone, role, civil_id) VALUES (?, ?, ?, ?, ?)').run(
    'Super Admin', 'superadmin@makan.com', '+96500000000', 'superadmin', '100000000000'
  );

  sqlite.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)').run('makan_management_fee', '1.000');

  // Insert dummy landlord if not exists
  const landlord = sqlite.prepare('SELECT * FROM users WHERE role = ?').get('landlord');
  if (!landlord) {
    sqlite.prepare('INSERT INTO users (name, email, phone, role, civil_id, moci_license_verified) VALUES (?, ?, ?, ?, ?, ?)').run(
      'Ahmad Al-Sabah', 'ahmad@example.com', '+96512345678', 'landlord', '280010101234', 1
    );
    const landlordId = sqlite.prepare('SELECT last_insert_rowid()').get() as any;
    const lId = landlordId['last_insert_rowid()'];
    
    sqlite.prepare('INSERT INTO buildings (landlord_id, name, address, paci_number) VALUES (?, ?, ?, ?)').run(
      lId, 'Al-Salmiya Tower', 'Salmiya, Block 4, Street 1', '12345678'
    );
    const buildingId = sqlite.prepare('SELECT last_insert_rowid()').get() as any;
    const bId = buildingId['last_insert_rowid()'];

    sqlite.prepare('INSERT INTO units (building_id, unit_number, rent_amount, status) VALUES (?, ?, ?, ?)').run(
      bId, '101', 450.0, 'occupied'
    );
    sqlite.prepare('INSERT INTO units (building_id, unit_number, rent_amount, status) VALUES (?, ?, ?, ?)').run(
      bId, '102', 500.0, 'vacant'
    );
    
    sqlite.prepare('INSERT INTO users (name, email, phone, role, civil_id) VALUES (?, ?, ?, ?, ?)').run(
      'Fahad Al-Mutairi', 'fahad@example.com', '+96587654321', 'tenant', '290010101234'
    );
    const tenantId = sqlite.prepare('SELECT last_insert_rowid()').get() as any;
    const tId = tenantId['last_insert_rowid()'];

    sqlite.prepare('INSERT INTO users (name, email, phone, role, civil_id) VALUES (?, ?, ?, ?, ?)').run(
      'Sayed Ali', 'sayed@example.com', '+96555555555', 'haris', '270010101234'
    );
    const harisId = sqlite.prepare('SELECT last_insert_rowid()').get() as any;
    const hId = harisId['last_insert_rowid()'];

    sqlite.prepare('INSERT INTO building_haris (building_id, haris_id) VALUES (?, ?)').run(bId, hId);

    const now = Date.now();
    const coolingOff = now + 14 * 24 * 60 * 60 * 1000;
    const endDate = now + 365 * 24 * 60 * 60 * 1000;
    
    sqlite.prepare('INSERT INTO leases (unit_id, tenant_id, start_date, end_date, is_executive_document, lease_hash, cooling_off_end_date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      1, tId, now, endDate, 1, '0x8f2a9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1', coolingOff
    );
    const leaseId = sqlite.prepare('SELECT last_insert_rowid()').get() as any;
    const leId = leaseId['last_insert_rowid()'];

    sqlite.prepare('INSERT INTO payments (lease_id, amount, management_fee, status, due_date) VALUES (?, ?, ?, ?, ?)').run(
      leId, 450.0, 1.0, 'pending', now + 3 * 24 * 60 * 60 * 1000
    );

    sqlite.prepare('INSERT INTO payments (lease_id, amount, management_fee, status, due_date, paid_date) VALUES (?, ?, ?, ?, ?, ?)').run(
      leId, 450.0, 1.0, 'paid', now - 30 * 24 * 60 * 60 * 1000, now - 29 * 24 * 60 * 60 * 1000
    );
    const paymentId = sqlite.prepare('SELECT last_insert_rowid()').get() as any;
    const pId = paymentId['last_insert_rowid()'];

    sqlite.prepare('INSERT INTO immutable_audit_log (payment_id, receipt_hash, pdf_url) VALUES (?, ?, ?)').run(
      pId, '0xabc123def456', 'https://makan.com/receipts/0xabc123def456.pdf'
    );

    // Seed 50 landlords and 200 units
    const areas = ['Hawally', 'Salmiya', 'Kuwait City', 'Farwaniya', 'Jahra', 'Ahmadi'];
    for (let i = 1; i <= 50; i++) {
      sqlite.prepare('INSERT INTO users (name, email, phone, role, civil_id, moci_license_verified) VALUES (?, ?, ?, ?, ?, ?)').run(
        `Landlord ${i}`, `landlord${i}@example.com`, `+96590000${i.toString().padStart(3, '0')}`, 'landlord', `280000000${i.toString().padStart(3, '0')}`, i % 3 !== 0 ? 1 : 0
      );
      const lIdObj = sqlite.prepare('SELECT last_insert_rowid()').get() as any;
      const newLandlordId = lIdObj['last_insert_rowid()'];

      const area = areas[i % areas.length];
      sqlite.prepare('INSERT INTO buildings (landlord_id, name, address, paci_number) VALUES (?, ?, ?, ?)').run(
        newLandlordId, `Building ${i}`, `${area}, Block ${i % 5 + 1}`, `123456${i.toString().padStart(2, '0')}`
      );
      const bIdObj = sqlite.prepare('SELECT last_insert_rowid()').get() as any;
      const newBuildingId = bIdObj['last_insert_rowid()'];

      for (let j = 1; j <= 4; j++) {
        sqlite.prepare('INSERT INTO units (building_id, unit_number, rent_amount, status) VALUES (?, ?, ?, ?)').run(
          newBuildingId, `${j}01`, 300 + (j * 50), j % 2 === 0 ? 'occupied' : 'vacant'
        );
      }
    }
  }
};

initDb();
