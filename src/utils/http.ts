import axios from 'axios';

export const local = axios.create({
    baseURL: process.env.LOCAL_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: () => true,
});

export const markets = axios.create({
    baseURL: 'https://data.alpaca.markets',
    headers: {
        Accept: 'application/json',
        'APCA-API-KEY-ID': process.env.APCA_API_KEY_ID,
        'APCA-API-SECRET-KEY': process.env.APCA_API_SECRET_KEY,
    },
    validateStatus: () => true,
});
