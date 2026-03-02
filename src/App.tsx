import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import LandlordDashboard from './components/LandlordDashboard';
import TenantDashboard from './components/TenantDashboard';
import HarisPortal from './components/HarisPortal';
import SuperAdmin from './components/SuperAdmin';
import PaymentPage from './components/PaymentPage';
import ConsentGateway from './components/ConsentGateway';
import LandlordOnboarding from './components/LandlordOnboarding';
import LandlordMaintenanceTriage from './components/LandlordMaintenanceTriage';
import LandlordCommunications from './components/LandlordCommunications';
import LandlordJudicialBundle from './components/LandlordJudicialBundle';
import LandlordLeaseAmendments from './components/LandlordLeaseAmendments';
import TenantReceiptArchive from './components/TenantReceiptArchive';
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
        <Route path="/landlord/onboarding" element={<ConsentGateway><LandlordOnboarding /></ConsentGateway>} />
        <Route path="/landlord/maintenance" element={<ConsentGateway><LandlordMaintenanceTriage /></ConsentGateway>} />
        <Route path="/landlord/communications" element={<ConsentGateway><LandlordCommunications /></ConsentGateway>} />
        <Route path="/landlord/judicial-bundle" element={<ConsentGateway><LandlordJudicialBundle /></ConsentGateway>} />
        <Route path="/landlord/amendments" element={<ConsentGateway><LandlordLeaseAmendments /></ConsentGateway>} />
        <Route path="/tenant/receipts" element={<ConsentGateway><TenantReceiptArchive /></ConsentGateway>} />
      </Routes>
    </Router>
  );
}
