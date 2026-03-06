<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>


# Makan 1.0 - Kuwait Property Management Portal

Makan 1.0 is a full-featured property management platform for Kuwait, designed for landlords, tenants, haris (building managers), and superadmins. It supports compliance with Kuwait's CITRA and MOCI regulations, and integrates with PACI for property ownership sync.

## Key Features

- **Landlord Dashboard**: Manage properties, buildings, units, tenants, payments, and compliance.
- **Tenant Portal**: View leases, payment history, and request maintenance.
- **Haris Portal**: Manage building maintenance, resident logs, and occupancy.
- **Superadmin Portal**: System-wide audit, compliance, and user management.
- **PACI Property Sync**: Landlords can authenticate with Kuwait Mobile ID (Hawyti) and import official property records from PACI, with conflict resolution and compliance logging.
- **Lease Amendments**: Digital addendums and e-signature support for lease changes.
- **Judicial Bundles**: One-click eviction package generator for law enforcement.
- **Audit Vault**: Immutable 5-year audit logs for all transactions and compliance events.
- **Bulk Communications**: Send WhatsApp/SMS reminders to tenants.
- **CITRA Compliance**: All data residency and audit requirements enforced.

## Technologies Used

- React 19 + TypeScript
- Vite
- Express.js backend
- SQLite with Drizzle ORM
- Tailwind CSS
- i18n (English/Arabic)

## Getting Started

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

The app will start on [http://localhost:5173](http://localhost:5173).

## Compliance & Data Residency

- All data is stored in Kuwait (me-central2 region) and complies with CITRA and MOCI regulations.
- PACI sync events are logged for legal audit trail.

## No AI Features

All AI-related code and services have been removed. The app is focused on secure, compliant property management for Kuwait.
