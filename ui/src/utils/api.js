import axios from 'axios';

const getApiUrl = () => {
    // If we're on a mobile device or another machine, we need to point to the server's IP
    // window.location.hostname will be the IP of the server when accessed from another device
    const hostname = window.location.hostname;
    return `http://${hostname}:3001`;
};

const API_URL = getApiUrl();

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
    login: async (identifier, password, orgCode) => { // identifier: username or phone
        const response = await apiInstance.post('/auth/login', { identifier, password, orgCode });
        return response.data;
    },
    signup: async (userData) => {
        const response = await apiInstance.post('/auth/signup', userData);
        return response.data;
    },
    getProfile: async () => {
        const response = await apiInstance.get('/auth/me');
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
    getVenues: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await apiInstance.get(`/venues${params ? '?' + params : ''}`);
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

    // Organizations
    getOrganizations: async () => {
        const response = await apiInstance.get('/organizations');
        return response.data;
    },
    createOrganization: async (data) => {
        const response = await apiInstance.post('/organizations', data);
        return response.data;
    },
    getOrganization: async (id) => {
        const response = await apiInstance.get(`/organizations/${id}`);
        return response.data;
    },
    updateOrganization: async (id, data) => {
        const response = await apiInstance.patch(`/organizations/${id}`, data);
        return response.data;
    },

    // Staff
    getStaff: async (organizationId) => {
        const query = organizationId ? `?organizationId=${organizationId}` : '';
        const response = await apiInstance.get(`/staff${query}`);
        return response.data;
    },
    createStaff: async (data) => {
        const response = await apiInstance.post('/staff', data);
        return response.data;
    },
    updateStaff: async (id, data) => {
        const response = await apiInstance.patch(`/staff/${id}`, data);
        return response.data;
    },
    deleteStaff: async (id) => {
        const response = await apiInstance.delete(`/staff/${id}`);
        return response.data;
    },
};
