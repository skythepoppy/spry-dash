// src/api/axios.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', 
});

// Add JWT token automatically if present in localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

export default api;
