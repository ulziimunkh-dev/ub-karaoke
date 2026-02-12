import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import VenueList from '../components/VenueList';
import BookingModal from '../components/BookingModal';
import { useData } from '../contexts/DataContext';
import { calculateDistance } from '../utils/geolocation';

const HomePage = () => {
    const { venues, addBooking, addReview, currentUser } = useData();
    const [filters, setFilters] = useState({
        search: '',
        district: '',
        rating: '0',
        nearMe: false,
        partyCapable: false,
        capacity: ''
    });
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    // Get location on mount and handle focus
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location", error);
                }
            );
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('focus') === 'search') {
            setTimeout(() => {
                document.getElementById('search-input')?.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 500);
        }
    }, []);

    // Calculate distances
    const distances = useMemo(() => {
        if (!userLocation) return {};
        const dists = {};
        venues.forEach(v => {
            if (v.latitude && v.longitude) {
                const d = calculateDistance(userLocation.lat, userLocation.lng, v.latitude, v.longitude);
                dists[v.id] = d;
            }
        });
        return dists;
    }, [userLocation, venues]);

    // Filter logic
    const filteredVenues = venues.filter(venue => {
        const matchesSearch = venue.name.toLowerCase().includes(filters.search.toLowerCase());
        const matchesDistrict = filters.district === '' || venue.district === filters.district;
        const matchesRating = venue.rating >= Number(filters.rating);
        const matchesParty = filters.partyCapable ? venue.rooms?.some(r => r.partySupport && (r.partySupport.birthday || r.partySupport.decoration)) : true;

        const matchesCapacity = filters.capacity
            ? venue.rooms?.some(r => {
                if (filters.capacity.includes('+')) {
                    const min = parseInt(filters.capacity);
                    return r.capacity >= min;
                }
                const [min, max] = filters.capacity.split('-').map(Number);
                return r.capacity >= min && r.capacity <= max;
            })
            : true;

        const isVenueActive = venue.isActive !== false;

        const results = {
            search: matchesSearch,
            district: matchesDistrict,
            rating: matchesRating,
            party: matchesParty,
            capacity: matchesCapacity,
            active: isVenueActive
        };

        if (Object.values(results).some(v => !v)) {
            // console.log(`[HomePage Debug] Venue ${venue.name} filtered out:`, results);
        }

        return matchesSearch && matchesDistrict && matchesRating && matchesParty && matchesCapacity && isVenueActive;
    }).sort((a, b) => {
        if (filters.nearMe && userLocation) {
            return (distances[a.id] || Infinity) - (distances[b.id] || Infinity);
        }
        return 0; // Default sort order (ID or as comes)
    });

    const handleBook = (venue) => {
        setSelectedVenue(venue);
    };

    const handleConfirmBooking = async (venueId, data) => {
        console.log("Booking Request:", venueId, data);

        const [startH, startM] = data.time.split(':').map(Number);
        const endDate = new Date(`${data.date}T${data.time}`);
        endDate.setHours(endDate.getHours() + Number(data.hours));
        const endH = endDate.getHours();
        const endM = endDate.getMinutes();
        const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

        // Calculate total price for all rooms
        let totalPrice = 0;
        // The data.rooms here is an array of IDs from BookingModal, 
        // but we need the room objects to get prices if we calculate it here.
        // Actually, BookingModal already calculates totalCost. 
        // Let's pass it in the data.

        const booking = {
            venueId,
            roomIds: data.rooms,
            customerName: currentUser ? currentUser.displayName || currentUser.name : "Guest User",
            userId: currentUser ? currentUser.id : null,
            date: data.date,
            startTime: data.time,
            endTime: endTime,
            duration: Number(data.hours),
            totalPrice: data.totalPrice, // We'll add this to the call in BookingModal
            customerPhone: currentUser?.phone || '99999999'
        };

        return await addBooking(booking);
    };

    return (
        <div className="min-h-screen bg-[#0B0B15] text-white selection:bg-[#b000ff] selection:text-white">
            <Header />
            <FilterBar filters={filters} onFilterChange={setFilters} />

            <main className="container mx-auto px-4 py-8">
                <VenueList
                    venues={filteredVenues}
                    onBook={handleBook}
                    distances={distances}
                />
            </main>

            {selectedVenue && (
                <BookingModal
                    venue={selectedVenue}
                    onClose={() => setSelectedVenue(null)}
                    onConfirmBooking={handleConfirmBooking}
                    onAddReview={addReview}
                />
            )}
        </div>
    );
};

export default HomePage;
