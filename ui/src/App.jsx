import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
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
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route path="/profile" element={<CustomerProfile />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </DataProvider>
  );
}
