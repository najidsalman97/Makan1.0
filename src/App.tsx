import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import LandlordDashboard from './components/LandlordDashboard';
import TenantDashboard from './components/TenantDashboard';
import HarisPortal from './components/HarisPortal';
import SuperAdmin from './components/SuperAdmin';
import PaymentPage from './components/PaymentPage';
import ConsentGateway from './components/ConsentGateway';
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
      </Routes>
    </Router>
  );
}
