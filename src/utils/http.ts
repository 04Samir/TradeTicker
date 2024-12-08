import axios from 'axios';

export const http = axios.create({
    baseURL: process.env.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: () => true,
});
