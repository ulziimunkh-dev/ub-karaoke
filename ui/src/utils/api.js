import axios from 'axios';

const API_URL = 'http://localhost:3001';

const apiInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    // Auth
    login: async (identifier, password) => { // identifier: username or phone
        const response = await apiInstance.post('/auth/login', { identifier, password });
        return response.data;
    },
    signup: async (userData) => {
        const response = await apiInstance.post('/auth/register', userData);
        return response.data;
    },
    getProfile: async () => {
        const response = await apiInstance.get('/auth/profile');
        return response.data;
    },
    updateProfile: async (data) => {
        const response = await apiInstance.patch('/users/profile', data);
        return response.data;
    },
    getUsers: async () => {
        const response = await apiInstance.get('/users');
        return response.data;
    },
    createUser: async (userData) => {
        const response = await apiInstance.post('/users', userData);
        return response.data;
    },
    updateUser: async (id, data) => {
        const response = await apiInstance.patch(`/users/${id}`, data);
        return response.data;
    },
    toggleUserStatus: async (id, data) => {
        const response = await apiInstance.patch(`/users/${id}/status`, data);
        return response.data;
    },
    verifyAccount: async (code) => {
        const response = await apiInstance.post('/auth/verify', { code });
        return response.data;
    },
    requestLoginOtp: async (identifier) => {
        const response = await apiInstance.post('/auth/login-otp-request', { identifier });
        return response.data;
    },
    loginWithOtp: async (identifier, code) => {
        const response = await apiInstance.post('/auth/login-otp', { identifier, code });
        return response.data;
    },
    forgotPassword: async (email) => {
        const response = await apiInstance.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (token, password) => {
        const response = await apiInstance.post('/auth/reset-password', { token, password });
        return response.data;
    },

    // Venues
    getVenues: async () => {
        const response = await apiInstance.get('/venues');
        return response.data;
    },
    getVenue: async (id) => {
        const response = await apiInstance.get(`/venues/${id}`);
        return response.data;
    },
    createVenue: async (data) => {
        const response = await apiInstance.post('/venues', data);
        return response.data;
    },
    updateVenue: async (id, data) => {
        const response = await apiInstance.patch(`/venues/${id}`, data);
        return response.data;
    },
    deleteVenue: async (id) => {
        const response = await apiInstance.delete(`/venues/${id}`);
        return response.data;
    },

    // Rooms
    createRoom: async (data) => {
        const response = await apiInstance.post('/rooms', data);
        return response.data;
    },
    updateRoom: async (id, data) => {
        const response = await apiInstance.patch(`/rooms/${id}`, data);
        return response.data;
    },
    deleteRoom: async (id) => {
        const response = await apiInstance.delete(`/rooms/${id}`);
        return response.data;
    },

    // Bookings
    getBookings: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await apiInstance.get(`/bookings?${params}`);
        return response.data;
    },
    createBooking: async (data) => {
        const response = await apiInstance.post('/bookings', data);
        return response.data;
    },
    createManualBooking: async (data) => {
        const response = await apiInstance.post('/bookings/manual', data);
        return response.data;
    },
    approveBooking: async (id) => {
        const response = await apiInstance.patch(`/bookings/${id}/approve`);
        return response.data;
    },
    rejectBooking: async (id) => {
        const response = await apiInstance.patch(`/bookings/${id}/reject`);
        return response.data;
    },
    updateBooking: async (id, data) => {
        const response = await apiInstance.patch(`/bookings/${id}`, data);
        return response.data;
    },

    // Audit
    getAuditLogs: async () => {
        const response = await apiInstance.get('/audit');
        return response.data;
    },

    // Payments
    getPayments: async () => {
        const response = await apiInstance.get('/payments');
        return response.data;
    },
    createPayment: async (data) => {
        const response = await apiInstance.post('/payments', data);
        return response.data;
    },
};
