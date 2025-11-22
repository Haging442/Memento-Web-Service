// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

// 매 요청마다 토큰 자동으로 넣어주기
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
