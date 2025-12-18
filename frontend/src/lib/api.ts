import axios from 'axios';
import type {
  User, Financier, Application, Offer, InfoRequest,
  Notification, AuthResponse, LeasingFormData, SaleLeasebackFormData
} from '../types';
import type { Contract, ContractCreateData } from '../types/contract';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for login/register endpoints - let the caller handle it
    const isAuthEndpoint = error.config?.url?.startsWith('/auth/login') || 
                           error.config?.url?.startsWith('/auth/register');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth - routes defined as /login, /register, /me, etc. (no trailing slash)
export const auth = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    company_name?: string;
    business_id?: string;
  }) => api.post<AuthResponse>('/auth/register', data),
  
  me: () => api.get<User>('/auth/me'),
  
  verify: (token: string) => api.post(`/auth/verify/${token}`),
  
  resendVerification: () => api.post('/auth/resend-verification'),
};

// Users - root "/" needs trailing slash, sub-paths don't
export const users = {
  list: (role?: string) =>
    api.get<User[]>('/users/', { params: { role } }),
  
  get: (id: number) => api.get<User>(`/users/${id}`),
  
  updateMe: (data: Partial<User>) =>
    api.put<User>('/users/me', data),
  
  createFinancierUser: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    financier_id: number;
  }) => api.post<User>('/users/financier-user', data),
  
  activate: (id: number) => api.put(`/users/${id}/activate`),
  
  deactivate: (id: number) => api.put(`/users/${id}/deactivate`),
};

// Financiers
export const financiers = {
  list: (activeOnly = false) =>
    api.get<Financier[]>('/financiers/', { params: { active_only: activeOnly } }),
  
  listActive: () => api.get<Financier[]>('/financiers/active'),
  
  get: (id: number) => api.get<Financier>(`/financiers/${id}`),
  
  create: (data: Partial<Financier>) =>
    api.post<Financier>('/financiers/', data),
  
  update: (id: number, data: Partial<Financier>) =>
    api.put<Financier>(`/financiers/${id}`, data),
  
  delete: (id: number) => api.delete(`/financiers/${id}`),
};

// Applications
export const applications = {
  list: (params?: { status_filter?: string; type_filter?: string }) =>
    api.get<Application[]>('/applications/', { params }),
  
  get: (id: number) => api.get<Application>(`/applications/${id}`),
  
  createLeasing: (data: LeasingFormData) =>
    api.post<Application>('/applications/leasing', data),
  
  createSaleLeaseback: (data: SaleLeasebackFormData) =>
    api.post<Application>('/applications/sale-leaseback', data),
  
  createPublicLeasing: (data: LeasingFormData) =>
    api.post<Application>('/applications/public/leasing', data),
  
  createPublicSaleLeaseback: (data: SaleLeasebackFormData) =>
    api.post<Application>('/applications/public/sale-leaseback', data),
  
  update: (id: number, data: Partial<Application>) =>
    api.put<Application>(`/applications/${id}`, data),
};

// Assignments
export const assignments = {
  create: (data: { application_id: number; financier_id: number; notes?: string }) =>
    api.post('/assignments/', data),
  
  getForApplication: (applicationId: number) =>
    api.get(`/assignments/application/${applicationId}`),
  
  delete: (id: number) => api.delete(`/assignments/${id}`),
};

// Info Requests
export const infoRequests = {
  create: (data: { application_id: number; message: string; requested_items?: string[] }) =>
    api.post<InfoRequest>('/info-requests/', data),
  
  getForApplication: (applicationId: number) =>
    api.get<InfoRequest[]>(`/info-requests/application/${applicationId}`),
  
  respond: (data: { info_request_id: number; message: string; attachment_ids?: number[] }) =>
    api.post<InfoRequest>('/info-requests/respond', data),
};

// Offers
export const offers = {
  create: (data: Partial<Offer> & { application_id: number }) =>
    api.post<Offer>('/offers/', data),
  
  update: (id: number, data: Partial<Offer>) =>
    api.put<Offer>(`/offers/${id}`, data),
  
  send: (id: number) => api.post<Offer>(`/offers/${id}/send`),
  
  approve: (id: number) => api.post<Offer>(`/offers/${id}/approve`),
  
  accept: (id: number) => api.post(`/offers/${id}/accept`),
  
  reject: (id: number) => api.post(`/offers/${id}/reject`),
  
  getForApplication: (applicationId: number) =>
    api.get<Offer[]>(`/offers/application/${applicationId}`),
  
  get: (id: number) => api.get<Offer>(`/offers/${id}`),
};

// Contracts
export const contracts = {
  create: (data: ContractCreateData) =>
    api.post<Contract>('/contracts/', data),
  
  update: (id: number, data: Partial<ContractCreateData>) =>
    api.put<Contract>(`/contracts/${id}`, data),
  
  upload: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/contracts/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadLogo: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/contracts/${id}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  send: (id: number) => api.post<Contract>(`/contracts/${id}/send`),
  
  sign: (id: number, signaturePlace?: string, signerName?: string) => 
    api.post<Contract>(`/contracts/${id}/sign`, null, { 
      params: { signature_place: signaturePlace, signer_name: signerName } 
    }),
  
  uploadSigned: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/contracts/${id}/upload-signed`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getForApplication: (applicationId: number) =>
    api.get<Contract[]>(`/contracts/application/${applicationId}`),
  
  get: (id: number) => api.get<Contract>(`/contracts/${id}`),
  
  getAllAdmin: () => api.get('/contracts/admin/all'),
};

// Notifications
export const notifications = {
  list: (unreadOnly = false) =>
    api.get<Notification[]>('/notifications/', { params: { unread_only: unreadOnly } }),
  
  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),
  
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Files
export const files = {
  upload: (applicationId: number, file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    return api.post(`/files/upload?application_id=${applicationId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getForApplication: (applicationId: number) =>
    api.get(`/files/application/${applicationId}`),
  
  download: (id: number) =>
    api.get(`/files/${id}/download`, { responseType: 'blob' }),
  
  delete: (id: number) => api.delete(`/files/${id}`),
};

// YTJ - Company Info (PRH Avoindata API) - Full data
export interface AddressInfo {
  street: string | null;
  postal_code: string | null;
  city: string | null;
  country?: string | null;
}

export interface NameEntry {
  name: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
}

export interface BusinessLine {
  code: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface RegisterEntry {
  register: string;
  status: string;
  description: string | null;
  date: string | null;
}

export interface CompanySituation {
  type: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface CompanyInfo {
  // Basic info
  business_id: string;
  name: string | null;
  all_names?: NameEntry[];
  
  // Addresses
  visiting_address?: AddressInfo | null;
  postal_address?: AddressInfo | null;
  // Legacy fields for backwards compatibility
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  
  // Company form
  company_form: string | null;
  company_form_code?: string | null;
  
  // Business
  main_business: string | null;
  main_business_code?: string | null;
  business_lines?: BusinessLine[];
  
  // Contact info
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  
  // Register info
  registered_entries?: RegisterEntry[];
  
  // Situations
  company_situations?: CompanySituation[];
  
  // Status
  status?: string;
  trade_register_status?: string;
  is_active: boolean;
  is_liquidated: boolean;
  
  // Dates
  registration_date: string | null;
  end_date?: string | null;
}

export interface CompanySearchResult {
  business_id: string;
  name: string;
  company_form: string | null;
  is_active: boolean;
  is_liquidated: boolean;
}

export interface CompanySearchResponse {
  results: CompanySearchResult[];
  total: number;
}

export const ytj = {
  getCompanyInfo: (businessId: string) =>
    api.get<CompanyInfo>(`/ytj/${businessId}`),
  
  searchByName: (name: string, limit?: number) =>
    api.get<CompanySearchResponse>('/ytj/search/by-name', { 
      params: { name, limit: limit || 10 } 
    }),
};

export default api;
