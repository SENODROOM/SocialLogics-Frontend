import axios from "axios";

const http = axios.create({ baseURL: "/api", timeout: 15000 });

http.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("sl_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (
      err.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("sl_token");
      window.location.href = "/login";
    }
    return Promise.reject(
      new Error(err.response?.data?.error || err.message || "Request failed"),
    );
  },
);

export const authAPI = {
  register: (u, e, p) =>
    http.post("/auth/register", { username: u, email: e, password: p }),
  login: (e, p) => http.post("/auth/login", { email: e, password: p }),
  me: () => http.get("/auth/me"),
  updateProfile: (d) => http.put("/auth/profile", d),
  changePassword: (d) => http.put("/auth/change-password", d),
};

export const searchAPI = {
  search: (params) => http.post("/search", params),
  platforms: (cat) =>
    http.get("/search/platforms", { params: { category: cat } }),
  suggestions: (q, signal) =>
    http.get("/search/suggestions", { params: { q, limit: 10 }, signal }),
  trending: (limit = 20, period = "all") =>
    http.get("/search/trending", { params: { limit, period } }),
  stats: () => http.get("/search/stats"),
  recordClick: (d) => http.post("/search/click", d).catch(() => {}),
};

export const recommendationsAPI = {
  // Fetch content recommendations for a query
  get: (q, platform = "all", limit = 8) =>
    http.get("/recommendations", { params: { q, platform, limit } }),

  // Fetch trending/homepage recommendations (uses popular query)
  trending: (limit = 8) =>
    http.get("/recommendations", {
      params: {
        q: "trending viral 2025",
        platform: "youtube,reddit,dailymotion",
        limit,
      },
    }),
};

export const historyAPI = {
  get: (page = 1, filters = {}) =>
    http.get("/history", { params: { page, ...filters } }),
  delete: (id) => http.delete(`/history/${id}`),
  clear: () => http.delete("/history"),
};

export const bookmarksAPI = {
  get: (params = {}) => http.get("/bookmarks", { params }),
  create: (d) => http.post("/bookmarks", d),
  update: (id, d) => http.put(`/bookmarks/${id}`, d),
  delete: (id) => http.delete(`/bookmarks/${id}`),
  toggleFavorite: (id) => http.post(`/bookmarks/${id}/toggle-favorite`),
};

export const usersAPI = {
  stats: () => http.get("/users/stats"),
  saveSearch: (d) => http.post("/users/saved-searches", d),
  deleteSaved: (i) => http.delete(`/users/saved-searches/${i}`),
};

export const alertsAPI = {
  get: () => http.get("/alerts"),
  create: (d) => http.post("/alerts", d),
  delete: (id) => http.delete(`/alerts/${id}`),
};

export default http;
