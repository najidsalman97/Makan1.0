import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone').notNull().unique(),
  role: text('role', { enum: ['landlord', 'tenant', 'haris', 'superadmin'] }).notNull(),
  civilId: text('civil_id').unique(),
  mociLicenseVerified: integer('moci_license_verified', { mode: 'boolean' }).notNull().default(false),
  mociLicenseNumber: text('moci_license_number'),
  licenseExpiryDate: integer('license_expiry_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const complianceLogs = sqliteTable('compliance_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  consentTimestamp: integer('consent_timestamp', { mode: 'timestamp' }).notNull().default(new Date()),
  ipAddress: text('ip_address').notNull(),
  browserFingerprint: text('browser_fingerprint').notNull(),
});

export const immutableAuditLog = sqliteTable('immutable_audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  paymentId: integer('payment_id').references(() => payments.id).notNull(),
  receiptHash: text('receipt_hash').notNull(),
  pdfUrl: text('pdf_url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const buildings = sqliteTable('buildings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  landlordId: integer('landlord_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  paciNumber: text('paci_number').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const buildingHaris = sqliteTable('building_haris', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  buildingId: integer('building_id').references(() => buildings.id).notNull(),
  harisId: integer('haris_id').references(() => users.id).notNull(),
});

export const units = sqliteTable('units', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  buildingId: integer('building_id').references(() => buildings.id).notNull(),
  unitNumber: text('unit_number').notNull(),
  rentAmount: real('rent_amount').notNull(),
  status: text('status', { enum: ['vacant', 'occupied', 'maintenance'] }).notNull().default('vacant'),
});

export const leases = sqliteTable('leases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  unitId: integer('unit_id').references(() => units.id).notNull(),
  tenantId: integer('tenant_id').references(() => users.id).notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  isExecutiveDocument: integer('is_executive_document', { mode: 'boolean' }).notNull().default(false), // PACI Hawyti signed
  leaseHash: text('lease_hash'),
  coolingOffEndDate: integer('cooling_off_end_date', { mode: 'timestamp' }).notNull(), // Law 10/2026
  intentToWithdraw: integer('intent_to_withdraw', { mode: 'boolean' }).notNull().default(false),
  intentToWithdrawDate: integer('intent_to_withdraw_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leaseId: integer('lease_id').references(() => leases.id).notNull(),
  amount: real('amount').notNull(), // Rent amount
  managementFee: real('management_fee').notNull().default(1.000), // 1.000 KWD Makan fee
  status: text('status', { enum: ['pending', 'paid', 'failed'] }).notNull().default('pending'),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  paidDate: integer('paid_date', { mode: 'timestamp' }),
  knetReceiptUrl: text('knet_receipt_url'),
});

export const maintenanceTickets = sqliteTable('maintenance_tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  buildingId: integer('building_id').references(() => buildings.id).notNull(),
  unitId: integer('unit_id').references(() => units.id),
  reporterId: integer('reporter_id').references(() => users.id).notNull(), // Haris or Tenant
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  aiClassification: text('ai_classification', { enum: ['Structural/Landlord', 'Usage/Tenant', 'Pending'] }).notNull().default('Pending'),
  aiConfidence: real('ai_confidence'),
  tenantResponsibility: text('tenant_responsibility', { enum: ['pending', 'accepted', 'disputed'] }).notNull().default('pending'),
  status: text('status', { enum: ['open', 'in_progress', 'resolved'] }).notNull().default('open'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});
