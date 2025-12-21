const API_BASE_URL = 'http://localhost:3001';

export const api = {
    // Venues
    getVenues: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.district) params.append('district', filters.district);
        if (filters.priceRange) params.append('priceRange', filters.priceRange);
        if (filters.search) params.append('search', filters.search);

        const url = `${API_BASE_URL}/venues${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch venues');
        return response.json();
    },

    getVenue: async (id) => {
        const response = await fetch(`${API_BASE_URL}/venues/${id}`);
        if (!response.ok) throw new Error('Failed to fetch venue');
        return response.json();
    },

    createVenue: async (venueData) => {
        const response = await fetch(`${API_BASE_URL}/venues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venueData)
        });
        if (!response.ok) throw new Error('Failed to create venue');
        return response.json();
    },

    updateVenue: async (id, venueData) => {
        const response = await fetch(`${API_BASE_URL}/venues/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venueData)
        });
        if (!response.ok) throw new Error('Failed to update venue');
        return response.json();
    },

    deleteVenue: async (id) => {
        const response = await fetch(`${API_BASE_URL}/venues/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete venue');
        return true;
    },

    // Rooms
    getRooms: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.venueId) params.append('venueId', filters.venueId);
        if (filters.isVIP !== undefined) params.append('isVIP', filters.isVIP);
        if (filters.minCapacity) params.append('minCapacity', filters.minCapacity);

        const url = `${API_BASE_URL}/rooms${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch rooms');
        return response.json();
    },

    createRoom: async (roomData) => {
        const response = await fetch(`${API_BASE_URL}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        if (!response.ok) throw new Error('Failed to create room');
        return response.json();
    },

    updateRoom: async (id, roomData) => {
        const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        if (!response.ok) throw new Error('Failed to update room');
        return response.json();
    },

    deleteRoom: async (id) => {
        const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete room');
        return true;
    },

    // Bookings
    getBookings: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.venueId) params.append('venueId', filters.venueId);
        if (filters.status) params.append('status', filters.status);

        const url = `${API_BASE_URL}/bookings${params.toString() ? '?' + params.toString() : ''}`;
        const token = localStorage.getItem('access_token');
        const response = await fetch(url, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch bookings');
        return response.json();
    },

    createBooking: async (bookingData) => {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(bookingData)
        });
        if (!response.ok) throw new Error('Failed to create booking');
        return response.json();
    },

    // Auth
    signup: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Signup failed');
        }
        return response.json();
    },

    login: async (identifier, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }
        return response.json();
    },

    getProfile: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No token found');

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    updateProfile: async (profileData) => {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No token found');

        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }
        return response.json();
    },

    // Reviews
    getReviews: async (venueId) => {
        const response = await fetch(`${API_BASE_URL}/reviews?venueId=${venueId}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        return response.json();
    },

    createReview: async (reviewData) => {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        if (!response.ok) throw new Error('Failed to create review');
        return response.json();
    },

    // Users
    getUsers: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No token found');

        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    }
};
