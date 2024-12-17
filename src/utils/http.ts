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

export const yahoo = axios.create({
    baseURL: 'https://query2.finance.yahoo.com',
    headers: {
        Accept: 'application/json',
        'Accept-Language': 'en-GB,en;q=0.9',
        Origin: 'https://uk.finance.yahoo.com',
        'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.1',
    },
    validateStatus: () => true,
});

export const hcaptcha = axios.create({
    baseURL: 'https://api.hcaptcha.com',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    validateStatus: () => true,
});
