import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Creating the app instance
const app = createApp(App)

// Configuring axios globally
axios.defaults.baseURL = 'http://localhost:5000/api'
app.config.globalProperties.$axios = axios

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('branchToken')}`
    }
});

axiosInstance.interceptors.request.use(
    config => {
        console.log('Axios Request:', {
            url: config.url,
            method: config.method,
            baseURL: config.baseURL,
            data: config.data
        });
        return config;
    },
    error => {
        console.error('Axios Request Error:', error);
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    response => {
        console.log('Axios Response:', {
            status: response.status,
            data: response.data
        });
        return response;
    },
    error => {
        console.error('Axios Response Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return Promise.reject(error);
    }
);
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('branchToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

app.use(router)
app.mount('#app')

export { axiosInstance }