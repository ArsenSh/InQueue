import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/', // Replace with your backend URL if different
});

export const fetchBanks = () => {
    return axios.get("/api/banks"); // Make sure this URL is correct
};
export const createAppointment = (appointmentData) => {
    return api.post('appointments/book', appointmentData)
        .then(response => response.data)
        .catch(error => console.error('Error booking appointment:', error));
};
