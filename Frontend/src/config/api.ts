const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = {
  baseUrl: API_URL,
  endpoints: {
    // Public endpoints
    getCurrentContent: () => `${API_URL}/api/content/current`,
    
    // Admin endpoints
    admin: {
      getAllContent: () => `${API_URL}/api/admin/content`,
      createContent: () => `${API_URL}/api/admin/content`,
      updateContent: (id: number) => `${API_URL}/api/admin/content/${id}`,
      deleteContent: (id: number) => `${API_URL}/api/admin/content/${id}`,
      uploadFile: () => `${API_URL}/api/admin/upload`,
      login: () => `${API_URL}/api/admin/login`,
    }
  }
};
