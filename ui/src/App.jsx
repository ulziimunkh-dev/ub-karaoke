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

import { useData } from './contexts/DataContext';
import BookingModal from './components/BookingModal';

const AppContent = () => {
  const [filters, setFilters] = useState({
    district: 'All',
    date: new Date(),
    childFriendly: false,
    partySupported: false
  });

  const { activeBooking, showResumeModal, setShowResumeModal, venues, addReview, addBooking } = useData();

  // Find venue for activeBooking
  const activeVenue = React.useMemo(() => {
    if (!activeBooking || !venues) return null;
    return venues.find(v => v.id === activeBooking.venueId);
  }, [activeBooking, venues]);

  const handleConfirmBooking = async (venueId, data) => {
    const [startH, startM] = data.time.split(':').map(Number);
    const endDate = new Date(`${data.date}T${data.time}`);
    endDate.setHours(endDate.getHours() + Number(data.hours));
    const endH = endDate.getHours();
    const endM = endDate.getMinutes();
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    return await addBooking({
      venueId,
      roomIds: data.rooms,
      date: data.date,
      startTime: data.time,
      endTime: endTime,
      duration: Number(data.hours),
      totalPrice: data.totalPrice,
    });
  };

  return (
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

      {showResumeModal && activeVenue && (
        <BookingModal
          venue={activeVenue}
          onClose={() => setShowResumeModal(false)}
          onConfirmBooking={handleConfirmBooking}
          onAddReview={addReview}
        />
      )}

      <ReloadPrompt />
    </Router>
  );
}

export default function App() {
  return (
    <DataProvider>
      <NotificationProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </NotificationProvider>
    </DataProvider>
  );
}
