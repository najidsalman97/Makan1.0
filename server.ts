import express from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { GoogleGenAI, Type } from '@google/genai';
import multer from 'multer';
import fs from 'fs';
import JSZip from 'jszip';

const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Compliance Endpoints
  app.get('/api/compliance/status/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const log = await db.select().from(schema.complianceLogs).where(eq(schema.complianceLogs.userId, userId)).get();
      res.json({ success: true, hasConsented: !!log });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/compliance/consent', async (req, res) => {
    try {
      const { userId, browserFingerprint } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      await db.insert(schema.complianceLogs).values({
        userId,
        ipAddress,
        browserFingerprint,
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/compliance/residency-check', (req, res) => {
    const region = process.env.GOOGLE_CLOUD_REGION || 'unknown';
    res.json({ success: true, region });
  });

  app.post('/api/landlord/:id/verify-moci', async (req, res) => {
    try {
      const landlordId = parseInt(req.params.id);
      const { mociLicenseNumber, civilId } = req.body;
      // Mock verification process
      await db.update(schema.users)
        .set({ 
          mociLicenseVerified: true, 
          mociLicenseNumber,
          civilId,
          licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        })
        .where(eq(schema.users.id, landlordId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Login Mock
  app.post('/api/login', async (req, res) => {
    const { phone } = req.body;
    try {
      const user = await db.select().from(schema.users).where(
        sql`${schema.users.phone} = ${phone} OR ${schema.users.email} = ${phone}`
      ).get();
      if (user) {
        res.json({ success: true, user });
      } else {
        res.status(401).json({ success: false, message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Landlord Dashboard Data
  app.get('/api/landlord/:id/dashboard', async (req, res) => {
    const landlordId = parseInt(req.params.id);
    try {
      const buildings = await db.select().from(schema.buildings).where(eq(schema.buildings.landlordId, landlordId)).all();
      
      let totalRent = 0;
      let totalUnits = 0;
      let occupiedUnits = 0;

      const buildingsData = await Promise.all(buildings.map(async (b) => {
        const units = await db.select().from(schema.units).where(eq(schema.units.buildingId, b.id)).all();
        totalUnits += units.length;
        
        let buildingRent = 0;
        const unitsWithLeases = await Promise.all(units.map(async (u) => {
          let lease = null;
          if (u.status === 'occupied') {
            occupiedUnits++;
            buildingRent += u.rentAmount;
            lease = await db.select().from(schema.leases).where(eq(schema.leases.unitId, u.id)).get();
          }
          return { ...u, lease };
        }));

        totalRent += buildingRent;

        return {
          ...b,
          units: unitsWithLeases,
          totalRent: buildingRent,
          occupancyRate: units.length > 0 ? (units.filter(u => u.status === 'occupied').length / units.length) * 100 : 0
        };
      }));

      res.json({
        success: true,
        data: {
          buildings: buildingsData,
          stats: {
            totalRent,
            totalUnits,
            occupiedUnits,
            occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
          }
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Eviction Package (Law 148/2025)
  app.get('/api/landlord/:id/eviction-package/:leaseId', async (req, res) => {
    const { leaseId } = req.params;
    try {
      const lease = await db.select().from(schema.leases).where(eq(schema.leases.id, parseInt(leaseId))).get();
      if (!lease) return res.status(404).json({ error: 'Lease not found' });

      const payments = await db.select().from(schema.payments).where(eq(schema.payments.leaseId, lease.id)).all();
      const missedPayments = payments.filter(p => p.status !== 'paid');

      const zip = new JSZip();
      
      // 1. PACI-signed Lease (Mock PDF)
      zip.file("PACI_Signed_Lease.pdf", "Mock PDF Content representing the signed lease.");
      
      // 2. Electronic Audit Log
      const auditLog = `Signature Metadata:\nTime: ${lease.createdAt}\nIP: 192.168.1.1\nDevice: Mobile Safari\nHash: ${lease.leaseHash}`;
      zip.file("Electronic_Audit_Log.txt", auditLog);
      
      // 3. Affidavit of Delinquency (CSV)
      let csvContent = "Payment ID,Due Date,Amount,Status\n";
      missedPayments.forEach(p => {
        csvContent += `${p.id},${p.dueDate},${p.amount},${p.status}\n`;
      });
      zip.file("Affidavit_of_Delinquency.csv", csvContent);

      const content = await zip.generateAsync({ type: "nodebuffer" });
      
      res.set('Content-Type', 'application/zip');
      res.set('Content-Disposition', `attachment; filename=Eviction_Package_${leaseId}.zip`);
      res.send(content);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate package' });
    }
  });

  // Tenant Dashboard Data
  app.get('/api/tenant/:id/dashboard', async (req, res) => {
    const tenantId = parseInt(req.params.id);
    try {
      const lease = await db.select().from(schema.leases).where(eq(schema.leases.tenantId, tenantId)).get();
      if (!lease) {
        return res.json({ success: true, data: { lease: null, payments: [], maintenance: [] } });
      }

      const unit = await db.select().from(schema.units).where(eq(schema.units.id, lease.unitId)).get();
      const building = await db.select().from(schema.buildings).where(eq(schema.buildings.id, unit!.buildingId)).get();
      const landlord = await db.select().from(schema.users).where(eq(schema.users.id, building!.landlordId)).get();
      const payments = await db.select().from(schema.payments).where(eq(schema.payments.leaseId, lease.id)).all();
      const maintenance = await db.select().from(schema.maintenanceTickets).where(eq(schema.maintenanceTickets.unitId, lease.unitId)).all();

      res.json({
        success: true,
        data: {
          lease: { ...lease, unit, building, landlord },
          payments,
          maintenance
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Tenant Withdraw Intent
  app.post('/api/tenant/:id/withdraw', async (req, res) => {
    const tenantId = parseInt(req.params.id);
    const { leaseId } = req.body;
    try {
      const lease = await db.select().from(schema.leases).where(eq(schema.leases.id, leaseId)).get();
      if (!lease) return res.status(404).json({ error: 'Lease not found' });

      // 1. Log intent
      await db.update(schema.leases)
        .set({ intentToWithdraw: true, intentToWithdrawDate: new Date() })
        .where(eq(schema.leases.id, leaseId))
        .run();

      // 2. Automate Refund via Upayments (Mock)
      console.log(`[Upayments API] Processing full refund for lease ${leaseId} to tenant ${tenantId}`);
      
      // 3. Update Unit Status back to vacant
      await db.update(schema.units)
        .set({ status: 'vacant' })
        .where(eq(schema.units.id, lease.unitId))
        .run();

      res.json({ success: true, message: 'Withdrawal processed and refund initiated.' });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Tenant Contract Error Correction
  app.post('/api/tenant/:id/correct-contract-error', async (req, res) => {
    const { leaseId, errorDescription } = req.body;
    try {
      // In a real app, this would create an amendment request record
      console.log(`[Amendment Request] Lease ${leaseId}: ${errorDescription}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Tenant Maintenance Responsibility
  app.post('/api/tenant/:id/maintenance/:ticketId/responsibility', async (req, res) => {
    const { ticketId } = req.params;
    const { action } = req.body; // 'accepted' or 'disputed'
    try {
      await db.update(schema.maintenanceTickets)
        .set({ tenantResponsibility: action })
        .where(eq(schema.maintenanceTickets.id, parseInt(ticketId)))
        .run();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Payment Page Data
  app.get('/api/payment/:id', async (req, res) => {
    const paymentId = parseInt(req.params.id);
    try {
      const payment = await db.select().from(schema.payments).where(eq(schema.payments.id, paymentId)).get();
      if (!payment) return res.status(404).json({ error: 'Payment not found' });

      const lease = await db.select().from(schema.leases).where(eq(schema.leases.id, payment.leaseId)).get();
      const unit = await db.select().from(schema.units).where(eq(schema.units.id, lease!.unitId)).get();
      const building = await db.select().from(schema.buildings).where(eq(schema.buildings.id, unit!.buildingId)).get();
      const landlord = await db.select().from(schema.users).where(eq(schema.users.id, building!.landlordId)).get();
      const tenant = await db.select().from(schema.users).where(eq(schema.users.id, lease!.tenantId)).get();

      res.json({
        success: true,
        data: {
          amount: payment.amount + payment.managementFee,
          tenantName: tenant?.name,
          unitNumber: unit?.unitNumber,
          landlordName: landlord?.name,
          mociLicenseNumber: landlord?.mociLicenseNumber,
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Haris Dashboard Data
  app.get('/api/haris/:id/dashboard', async (req, res) => {
    const harisId = parseInt(req.params.id);
    try {
      const assignedBuildings = await db.select().from(schema.buildingHaris).where(eq(schema.buildingHaris.harisId, harisId)).all();
      const buildingIds = assignedBuildings.map(ab => ab.buildingId);

      if (buildingIds.length === 0) {
        return res.json({ success: true, data: { buildings: [], stats: { totalUnits: 0, paidToday: 0, pastDue: 0 } } });
      }

      let totalUnits = 0;
      let paidToday = 0;
      let pastDue = 0;

      const buildingsData = await Promise.all(buildingIds.map(async (bId) => {
        const building = await db.select().from(schema.buildings).where(eq(schema.buildings.id, bId)).get();
        const units = await db.select().from(schema.units).where(eq(schema.units.buildingId, bId)).all();
        totalUnits += units.length;

        const unitsWithDetails = await Promise.all(units.map(async (u) => {
          let paymentStatus = 'vacant';
          let tenantPhone = null;

          if (u.status === 'occupied') {
            const lease = await db.select().from(schema.leases).where(eq(schema.leases.unitId, u.id)).get();
            if (lease) {
              const tenant = await db.select().from(schema.users).where(eq(schema.users.id, lease.tenantId)).get();
              tenantPhone = tenant?.phone;

              const payments = await db.select().from(schema.payments).where(eq(schema.payments.leaseId, lease.id)).all();
              const now = new Date();
              
              // Simplistic logic for demonstration
              const latestPayment = payments.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0];
              if (latestPayment) {
                if (latestPayment.status === 'paid') {
                  paymentStatus = 'paid';
                  // Check if paid today
                  if (latestPayment.paidDate && latestPayment.paidDate.toDateString() === now.toDateString()) {
                    paidToday++;
                  }
                } else if (latestPayment.dueDate < now) {
                  paymentStatus = 'past_due';
                  pastDue++;
                } else {
                  paymentStatus = 'pending';
                }
              } else {
                paymentStatus = 'pending';
              }
            }
          }

          return { ...u, paymentStatus, tenantPhone };
        }));

        return { ...building, units: unitsWithDetails };
      }));

      res.json({
        success: true,
        data: {
          buildings: buildingsData,
          stats: { totalUnits, paidToday, pastDue }
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Middleware for SuperAdmin
  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await db.select().from(schema.users).where(eq(schema.users.id, parseInt(userId))).get();
    if (!user || user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  app.get('/api/superadmin/dashboard', requireSuperAdmin, async (req, res) => {
    try {
      const landlords = await db.select().from(schema.users).where(eq(schema.users.role, 'landlord')).all();
      const tenants = await db.select().from(schema.users).where(eq(schema.users.role, 'tenant')).all();
      const buildings = await db.select().from(schema.buildings).all();
      const units = await db.select().from(schema.units).all();
      const leases = await db.select().from(schema.leases).all();
      const payments = await db.select().from(schema.payments).all();
      const maintenance = await db.select().from(schema.maintenanceTickets).all();
      const settings = await db.select().from(schema.systemSettings).all();

      const activeLandlords = landlords.length;
      const verifiedLandlords = landlords.filter(l => l.mociLicenseVerified).length;
      
      const totalRent = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const totalFees = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.managementFee, 0);

      const withdrawals = leases.filter(l => l.intentToWithdraw);
      const executiveDocs = leases.filter(l => l.isExecutiveDocument).length;
      const pendingDocs = leases.length - executiveDocs;

      // Heatmap data (mocked by area from building address)
      const heatmap = buildings.reduce((acc: any, b) => {
        const area = b.address.split(',')[0];
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {});

      // AI Accuracy (mocked based on tenant responsibility accepted vs disputed)
      const aiCorrect = maintenance.filter(m => m.tenantResponsibility === 'accepted').length;
      const aiTotal = maintenance.filter(m => m.tenantResponsibility !== 'pending').length;
      const aiAccuracy = aiTotal > 0 ? (aiCorrect / aiTotal) * 100 : 100;

      res.json({
        success: true,
        data: {
          landlords,
          stats: {
            activeLandlords,
            verifiedLandlords,
            totalBuildings: buildings.length,
            totalUnits: units.length,
            activeLeases: leases.length,
            totalRent,
            totalFees,
            executiveDocs,
            pendingDocs,
            aiAccuracy
          },
          withdrawals: withdrawals.map(w => ({
            ...w,
            tenant: tenants.find(t => t.id === w.tenantId) || { name: 'Unknown' }
          })),
          maintenance,
          heatmap,
          settings: settings.reduce((acc: any, s) => ({ ...acc, [s.key]: s.value }), {})
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/superadmin/settings', requireSuperAdmin, async (req, res) => {
    const { key, value } = req.body;
    try {
      await db.insert(schema.systemSettings).values({ key, value }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value } }).run();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/superadmin/broadcast', requireSuperAdmin, async (req, res) => {
    const { message } = req.body;
    try {
      const landlords = await db.select().from(schema.users).where(eq(schema.users.role, 'landlord')).all();
      // In a real app, integrate with Twilio or WhatsApp Business API here
      console.log(`Broadcasting message to ${landlords.length} landlords: ${message}`);
      res.json({ success: true, count: landlords.length });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/superadmin/archive', requireSuperAdmin, async (req, res) => {
    try {
      const logs = await db.select().from(schema.immutableAuditLog).all();
      const logsWithDetails = await Promise.all(logs.map(async (log) => {
        const payment = await db.select().from(schema.payments).where(eq(schema.payments.id, log.paymentId)).get();
        return { ...log, payment };
      }));
      res.json({ success: true, data: logsWithDetails });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // AI Maintenance Engine
  app.post('/api/maintenance/upload', upload.single('image'), async (req, res) => {
    try {
      const { buildingId, unitId, reporterId, description, latitude, longitude } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Image is required' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const imageBytes = fs.readFileSync(file.path);
      const base64EncodeString = imageBytes.toString('base64');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: file.mimetype,
                data: base64EncodeString,
              },
            },
            {
              text: `Analyze this maintenance issue image and description: "${description}". 
              Classify if this is a "Structural/Landlord" issue (e.g., pipes, roof, AC unit failure) 
              or a "Usage/Tenant" issue (e.g., broken window by tenant, clogged toilet from misuse).
              Return a JSON object with "classification" (either "Structural/Landlord" or "Usage/Tenant") and "confidence" (number 0-1).`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: {
                type: Type.STRING,
                description: 'The classification of the issue',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score from 0 to 1',
              },
            },
            required: ['classification', 'confidence'],
          },
        },
      });

      const result = JSON.parse(response.text);

      // Save to DB
      await db.insert(schema.maintenanceTickets).values({
        buildingId: parseInt(buildingId),
        unitId: unitId ? parseInt(unitId) : null,
        reporterId: parseInt(reporterId),
        description,
        imageUrl: file.path,
        aiClassification: result.classification,
        aiConfidence: result.confidence,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: 'open',
      }).run();

      res.json({ success: true, classification: result.classification, confidence: result.confidence });
    } catch (error) {
      console.error('AI Error:', error);
      res.status(500).json({ error: 'Failed to process image' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
