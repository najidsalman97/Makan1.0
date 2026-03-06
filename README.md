# Makan 1.0 - Kuwait Property Management Portal

This project was built for real-world property management in Kuwait.

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
- **AI Maintenance Triage**: (Optional) Use Gemini AI for automated maintenance issue classification from images and descriptions.

## Technologies Used

- React 19 + TypeScript
- Vite
- Express.js backend
- SQLite with Drizzle ORM
- Tailwind CSS
- i18n (English/Arabic)
- Gemini AI (for maintenance triage, if enabled)

## Getting Started

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (for AI maintenance triage)
3. Run the app:
   `npm run dev`

The app will start on [http://localhost:5173](http://localhost:5173).

## Compliance & Data Residency

- All data is stored in Kuwait (me-central2 region) and complies with CITRA and MOCI regulations.
- PACI sync events are logged for legal audit trail.
