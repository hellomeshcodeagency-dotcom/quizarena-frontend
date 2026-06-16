import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('qa_token');
      localStorage.removeItem('qa_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ───────────────────────────────────────────────────
export const authAPI = {
  register:       (data)          => api.post('/auth/register', data),
  login:          (data)          => api.post('/auth/login', data),
  me:             ()              => api.get('/auth/me'),
  forgotPassword: (email)         => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)          => api.post('/auth/reset-password', data),
  changePassword: (data)          => api.post('/auth/change-password', data),
};

// ── WALLET ─────────────────────────────────────────────────
export const walletAPI = {
  get:            ()        => api.get('/wallet'),
  transactions:   (p = {})  => api.get('/wallet/transactions', { params: p }),
  initDeposit:    (amount)  => api.post('/wallet/deposit/init', { amount }),
  verifyDeposit:  (ref)     => api.get(`/wallet/deposit/verify/${ref}`),
  withdraw:       (data)    => api.post('/wallet/withdraw', data),
  buyCoins:       (coins)   => api.post('/wallet/coins/buy', { coins }),
};

// ── GAME ───────────────────────────────────────────────────
export const gameAPI = {
  findMatch:    (data) => api.post('/game/match', data),
  getRoom:      (id)   => api.get(`/game/room/${id}`),
  categories:   ()     => api.get('/game/categories'),
  leaderboard:  (p)    => api.get('/game/leaderboard', { params: p }),
  stats:        ()     => api.get('/game/stats'),
};

// ── TOURNAMENTS ────────────────────────────────────────────
export const tournamentAPI = {
  list:     ()   => api.get('/tournaments'),
  register: (id) => api.post(`/tournaments/${id}/register`),
};

// ── VIP ────────────────────────────────────────────────────
export const vipAPI = {
  subscribe: (plan) => api.post('/vip/subscribe', { plan }),
};

// ── ADS ────────────────────────────────────────────────────
export const adsAPI = {
  get: (placement) => api.get('/ads', { params: { placement } }),
};

// ── REFERRALS ──────────────────────────────────────────────
export const referralAPI = {
  list: () => api.get('/referrals'),
};

export default api;
