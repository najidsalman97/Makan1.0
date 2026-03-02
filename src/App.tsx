import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import LandlordDashboard from './components/LandlordDashboard';
import TenantDashboard from './components/TenantDashboard';
import HarisPortal from './components/HarisPortal';
import SuperAdmin from './components/SuperAdmin';
import EnhancedSuperAdmin from './components/EnhancedSuperAdmin';
import PaymentPage from './components/PaymentPage';
import ConsentGateway from './components/ConsentGateway';
import LandlordOnboarding from './components/LandlordOnboarding';
import LandlordMaintenanceTriage from './components/LandlordMaintenanceTriage';
import LandlordCommunications from './components/LandlordCommunications';
import LandlordJudicialBundle from './components/LandlordJudicialBundle';
import LandlordLeaseAmendments from './components/LandlordLeaseAmendments';
import TenantReceiptArchive from './components/TenantReceiptArchive';
import FinancialAnalytics from './components/FinancialAnalytics';
import MOCICompliance from './components/MOCICompliance';
import HarisBuildingDashboard from './components/HarisBuildingDashboard';
import HarisResidentLog from './components/HarisResidentLog';
import TenantStatutoryWithdrawal from './components/TenantStatutoryWithdrawal';
import HarisMaintenanceAI from './components/HarisMaintenanceAI';
import InvoiceAndBilling from './components/InvoiceAndBilling';
import DisputeResolution from './components/DisputeResolution';
import LatePaymentAutomation from './components/LatePaymentAutomation';
import TenantProfileManagement from './components/TenantProfileManagement';
import UnitManagement from './components/UnitManagement';
import ContractorManagement from './components/ContractorManagement';
import BulkImportExport from './components/BulkImportExport';
import AdvancedSearch from './components/AdvancedSearch';
import LeaseDocumentGenerator from './components/LeaseDocumentGenerator';
import EnhancedAuditReports from './components/EnhancedAuditReports';
import { withCITRA } from './middleware/CITRAComplianceMiddleware';
import './i18n';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/landlord" element={<ConsentGateway><LandlordDashboard /></ConsentGateway>} />
        <Route path="/tenant" element={<ConsentGateway><TenantDashboard /></ConsentGateway>} />
        <Route path="/haris" element={<ConsentGateway><HarisPortal /></ConsentGateway>} />
        <Route path="/superadmin" element={<ConsentGateway><SuperAdmin /></ConsentGateway>} />
        <Route path="/payment/:id" element={<PaymentPage />} />
        
        {/* Landlord Routes */}
        <Route path="/landlord/onboarding" element={<ConsentGateway><LandlordOnboarding /></ConsentGateway>} />
        <Route path="/landlord/maintenance" element={<ConsentGateway><LandlordMaintenanceTriage /></ConsentGateway>} />
        <Route path="/landlord/communications" element={<ConsentGateway><LandlordCommunications /></ConsentGateway>} />
        <Route path="/landlord/judicial-bundle" element={<ConsentGateway><LandlordJudicialBundle /></ConsentGateway>} />
        <Route path="/landlord/amendments" element={<ConsentGateway><LandlordLeaseAmendments /></ConsentGateway>} />
        <Route path="/landlord/analytics" element={<ConsentGateway><FinancialAnalytics /></ConsentGateway>} />
        <Route path="/landlord/moci-compliance" element={<ConsentGateway><MOCICompliance /></ConsentGateway>} />
        <Route path="/landlord/invoicing" element={<ConsentGateway><InvoiceAndBilling /></ConsentGateway>} />
        <Route path="/landlord/disputes" element={<ConsentGateway><DisputeResolution /></ConsentGateway>} />
        <Route path="/landlord/late-payments" element={<ConsentGateway><LatePaymentAutomation /></ConsentGateway>} />
        <Route path="/landlord/tenants" element={<ConsentGateway><TenantProfileManagement /></ConsentGateway>} />
        <Route path="/landlord/units" element={<ConsentGateway><UnitManagement /></ConsentGateway>} />
        <Route path="/landlord/contractors" element={<ConsentGateway><ContractorManagement /></ConsentGateway>} />
        <Route path="/landlord/import-export" element={<ConsentGateway><BulkImportExport /></ConsentGateway>} />
        <Route path="/landlord/search" element={<ConsentGateway><AdvancedSearch /></ConsentGateway>} />
        <Route path="/landlord/lease-generator" element={<ConsentGateway><LeaseDocumentGenerator /></ConsentGateway>} />
        
        {/* Tenant Routes */}
        <Route path="/tenant/receipts" element={<ConsentGateway><TenantReceiptArchive /></ConsentGateway>} />
        <Route path="/tenant/withdrawal" element={<ConsentGateway><TenantStatutoryWithdrawal /></ConsentGateway>} />
        
        {/* Haris Routes */}
        <Route path="/haris/buildings" element={<ConsentGateway><HarisBuildingDashboard /></ConsentGateway>} />
        <Route path="/haris/resident-log" element={<ConsentGateway><HarisResidentLog /></ConsentGateway>} />
        <Route path="/haris/maintenance-ai" element={<ConsentGateway><HarisMaintenanceAI /></ConsentGateway>} />
        
        {/* SuperAdmin Routes */}
        <Route path="/superadmin/enhanced" element={<ConsentGateway><EnhancedSuperAdmin /></ConsentGateway>} />
        <Route path="/superadmin/audit-reports" element={<ConsentGateway><EnhancedAuditReports /></ConsentGateway>} />
      </Routes>
    </Router>
  );
}
