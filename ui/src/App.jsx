import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import StaffLoginPage from './pages/StaffLoginPage';
import CustomerProfile from './pages/CustomerProfile';
import { LanguageProvider } from './contexts/LanguageContext';
import { DataProvider } from './contexts/DataContext';

export default function App() {
  const [filters, setFilters] = useState({
    district: 'All',
    date: new Date(),
    childFriendly: false,
    partySupported: false
  });

  return (
    <DataProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage filters={filters} setFilters={setFilters} />} />
            <Route path="/dashboard" element={<AdminPage />} />
            <Route path="/sysadmin" element={<AdminLoginPage />} />
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route path="/user/profile" element={<CustomerProfile />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </DataProvider>
  );
}
