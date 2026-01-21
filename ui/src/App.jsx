import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import StaffLoginPage from './pages/StaffLoginPage';
import CustomerProfile from './pages/CustomerProfile';
import { LanguageProvider } from './contexts/LanguageContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';

import Pricing from './components/public/Pricing';
import AboutUs from './components/public/AboutUs';
import Policy from './components/public/Policy';
import FAQ from './components/public/FAQ';
import ReservationBanner from './components/ReservationBanner';
import ReloadPrompt from './components/ReloadPrompt';


export default function App() {
  const [filters, setFilters] = useState({
    district: 'All',
    date: new Date(),
    childFriendly: false,
    partySupported: false
  });

  return (
    <DataProvider>
      <NotificationProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage filters={filters} setFilters={setFilters} />} />
              <Route path="/about" element={<div className="pt-20"><AboutUs /></div>} />
              <Route path="/pricing" element={<div className="pt-20"><Pricing /></div>} />
              <Route path="/policy" element={<div className="pt-20"><Policy /></div>} />
              <Route path="/faq" element={<div className="pt-20"><FAQ /></div>} />
              <Route path="/dashboard" element={<AdminPage />} />
              <Route path="/sysadmin" element={<AdminLoginPage />} />
              <Route path="/staff/login" element={<StaffLoginPage />} />
              <Route path="/user/profile" element={<CustomerProfile />} />
            </Routes>
            <ReservationBanner />
          </Router>
          <ReloadPrompt />

        </LanguageProvider>
      </NotificationProvider>
    </DataProvider>
  );
}
