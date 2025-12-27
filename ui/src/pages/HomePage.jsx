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

    // Get location on mount
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

        return matchesSearch && matchesDistrict && matchesRating && matchesParty && matchesCapacity;
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

        // Loop through all selected rooms and create a booking for each
        for (const room of data.rooms) {
            const booking = {
                venueId,
                roomId: room.id, // API expects roomId
                roomName: room.name,
                customerName: currentUser ? currentUser.name : "Guest User",
                userId: currentUser ? currentUser.id : null,
                date: data.date,
                startTime: data.time,
                duration: Number(data.hours),
                totalPrice: ((Number(room.hourlyRate) || Number(room.pricePerHour) || 0) * Number(data.hours)) + (data.addOns.birthday ? 50000 / data.rooms.length : 0) + (data.addOns.decoration ? 30000 / data.rooms.length : 0),
                customerPhone: currentUser?.phone || '99999999'
            };
            await addBooking(booking);
        }
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
