import { create } from 'zustand';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('qa_token');
    const cached = localStorage.getItem('qa_user');
    if (token && cached) {
      set({ token, user: JSON.parse(cached), loading: false });
      connectSocket(token);
      // Refresh user data
      try {
        const { data } = await authAPI.me();
        const user = data.user;
        localStorage.setItem('qa_user', JSON.stringify(user));
        set({ user });
      } catch (_) {}
    } else {
      set({ loading: false });
    }
  },

  login: async (identifier, password) => {
    const { data } = await authAPI.login({ identifier, password });
    localStorage.setItem('qa_token', data.token);
    localStorage.setItem('qa_user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
    connectSocket(data.token);
    return data;
  },

  register: async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('qa_token', data.token);
    localStorage.setItem('qa_user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
    connectSocket(data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('qa_token');
    localStorage.removeItem('qa_user');
    disconnectSocket();
    set({ user: null, token: null });
  },

  updateUser: (updates) => {
    const user = { ...get().user, ...updates };
    localStorage.setItem('qa_user', JSON.stringify(user));
    set({ user });
  },

  updateBalance: (balance, coins) => {
    get().updateUser({ balance, coins });
  },
}));

export default useAuthStore;
