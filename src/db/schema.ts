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

// New tables for February 2026 Digital Commerce Decree features

export const leaseAmendments = sqliteTable('lease_amendments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leaseId: integer('lease_id').references(() => leases.id).notNull(),
  originalLeaseHash: text('original_lease_hash').notNull(), // Hash of original lease
  errorType: text('error_type').notNull(), // e.g., "typo_name", "wrong_unit_number"
  errorDescription: text('error_description').notNull(),
  correctionDetails: text('correction_details').notNull(), // JSON of what was corrected
  amendmentHash: text('amendment_hash').notNull(), // Hash of amended lease
  createdBy: integer('created_by').references(() => users.id).notNull(),
  approvedBy: integer('approved_by').references(() => users.id),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
});

export const maintenanceDecisions = sqliteTable('maintenance_decisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id').references(() => maintenanceTickets.id).notNull(),
  landlordId: integer('landlord_id').references(() => users.id).notNull(),
  decision: text('decision', { enum: ['approve_assign', 'reclassify', 'request_info', 'resolve'] }).notNull(),
  newClassification: text('new_classification', { enum: ['Structural/Landlord', 'Usage/Tenant', 'Pending'] }),
  assignedContractorId: integer('assigned_contractor_id'),
  internalNote: text('internal_note'), // Private note not visible to tenant
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const communicationTemplates = sqliteTable('communication_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  landlordId: integer('landlord_id').references(() => users.id).notNull(),
  paymentIds: text('payment_ids').notNull(), // JSON array of payment IDs
  templateType: text('template_type', { enum: ['whatsapp_reminder', 'email_notice', 'sms_alert'] }).notNull().default('whatsapp_reminder'),
  templateLanguage: text('template_language', { enum: ['en', 'ar'] }).notNull(),
  preFilledContent: text('pre_filled_content').notNull(), // JSON with tenant info and payment links
  deliveryStatus: text('delivery_status', { enum: ['draft', 'scheduled', 'sent', 'failed'] }).notNull().default('draft'),
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  failureReason: text('failure_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const immutableRecords = sqliteTable('immutable_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recordType: text('record_type', { enum: ['payment', 'lease', 'amendment'] }).notNull(),
  recordId: integer('record_id').notNull(), // References payment/lease/amendment ID
  recordHash: text('record_hash').notNull(), // Cryptographic hash of record
  pdfSnapshot: text('pdf_snapshot').notNull(), // Base64 encoded PDF snapshot
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
  retentionUntil: integer('retention_until', { mode: 'timestamp' }).notNull(), // 5 years from creation
  isImmutable: integer('is_immutable', { mode: 'boolean' }).notNull().default(true),
});

export const residencyChecks = sqliteTable('residency_checks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  checkTimestamp: integer('check_timestamp', { mode: 'timestamp' }).notNull().default(new Date()),
  detectedRegion: text('detected_region').notNull(),
  isCompliant: integer('is_compliant', { mode: 'boolean' }).notNull(), // true if me-central2
  alertTriggered: integer('alert_triggered', { mode: 'boolean' }).notNull().default(false),
});
