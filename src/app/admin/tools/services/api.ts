export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  // Only set Content-Type to JSON if it's not FormData and not already set
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const tokensStr = localStorage.getItem('tokens');
    if (tokensStr) {
      try {
        const parsed = JSON.parse(tokensStr);
        if (parsed?.access) {
          headers.set('Authorization', `Bearer ${parsed.access}`);
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    let errorMessage = errorData.message || errorData.error_detail || errorData.detail || '';
    
    // If there's a detailed 'errors' object (common in DRF/our custom responses), flatten it
    if (errorData.errors && typeof errorData.errors === 'object') {
      const fieldErrors = Object.entries(errorData.errors)
        .map(([field, msgs]) => {
          const message = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          return `${field}: ${message}`;
        })
        .join('\n');
      
      errorMessage = errorMessage 
        ? `${errorMessage}\n${fieldErrors}`
        : fieldErrors;
    }
    
    throw new Error(errorMessage || `API error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const AdminDashboardService = {
  fetchStats: () => fetchWithAuth('/tools/admin/dashboard/'),
  fetchLogs: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    provider?: string;
    tool?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.provider && params.provider !== 'all') searchParams.set('provider', params.provider);
    if (params?.tool && params.tool !== 'all') searchParams.set('tool', params.tool);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const qs = searchParams.toString();
    return fetchWithAuth(`/tools/admin/logs/${qs ? `?${qs}` : ''}`);
  },
  exportLogs: async (params?: {
    search?: string;
    provider?: string;
    tool?: string;
    start_date?: string;
    end_date?: string;
    format?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.provider && params.provider !== 'all') searchParams.set('provider', params.provider);
    if (params?.tool && params.tool !== 'all') searchParams.set('tool', params.tool);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.format) searchParams.set('format', params.format);
    
    const url = `/tools/admin/logs/export/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    console.log('Exporting logs from URL:', url);
    return fetchWithAuth(url);
  },
};

export const CategoryService = {
  fetchAll: () => fetchWithAuth('/tools/categories/'),
  create: (data: any) => fetchWithAuth('/tools/categories/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchWithAuth(`/tools/categories/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchWithAuth(`/tools/categories/${id}/`, { method: 'DELETE' }),
};

export const ToolService = {
  fetchAll: async (params?: {
    page?: number;
    page_size?: number;
    category?: number;
    search?: string;
    active?: string;
    premium?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.category) searchParams.set('category', params.category.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.active && params.active !== 'all') searchParams.set('active', params.active);
    if (params?.premium && params.premium !== 'all') searchParams.set('premium', params.premium);
    const qs = searchParams.toString();
    const url = `/tools/${qs ? `?${qs}` : ''}`;
    const data = await fetchWithAuth(url);
    // Returns { count, page, page_size, total_pages, results }
    return data;
  },
  fetchAllFlat: async () => {
    // For dropdowns that need all tools without pagination
    const data = await fetchWithAuth('/tools/?page_size=500');
    return Array.isArray(data) ? data : (data?.results ?? []);
  },
  fetchDetail: (slug: string) => fetchWithAuth(`/tools/${slug}/`),
  create: (data: any) => fetchWithAuth('/tools/', { method: 'POST', body: JSON.stringify(data) }),
  update: (slug: string, data: any) => fetchWithAuth(`/tools/${slug}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (slug: string) => fetchWithAuth(`/tools/${slug}/`, { method: 'DELETE' }),
  bulkImport: (data: any[] | FormData) => {
    const options: RequestInit = { method: 'POST' };
    if (data instanceof FormData) {
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
    return fetchWithAuth('/tools/admin/bulk-import/', options);
  },
};

export const InputService = {
  fetchAllByTool: (slug: string) => fetchWithAuth(`/tools/${slug}/inputs/`),
  create: (slug: string, data: any) => fetchWithAuth(`/tools/${slug}/inputs/`, { method: 'POST', body: JSON.stringify(data) }),
  update: (slug: string, id: number, data: any) => fetchWithAuth(`/tools/${slug}/inputs/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (slug: string, id: number) => fetchWithAuth(`/tools/${slug}/inputs/${id}/`, { method: 'DELETE' }),
};

export const OrganisationService = {
  fetchAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return fetchWithAuth(`/schools/${qs ? `?${qs}` : ''}`);
  },
  create: (data: any) => fetchWithAuth('/schools/', { method: 'POST', body: JSON.stringify(data) }),
  fetchAlerts: () => fetchWithAuth('/schools/alerts/'),
  fetchMonitoring: (id: string) => fetchWithAuth(`/schools/${id}/monitoring/`),
  toggleActive: (id: string) => fetchWithAuth(`/schools/${id}/toggle-active/`, { method: 'PATCH' }),
  assignPlan: (id: string, planName: string) => fetchWithAuth(`/schools/${id}/upgrade/`, { method: 'PATCH', body: JSON.stringify({ newPlan: planName }) }),
  topupCredits: (id: string, percentage: number) => fetchWithAuth(`/schools/${id}/billing/topup/`, { method: 'POST', body: JSON.stringify({ percentage }) }),
};

export const PlanService = {
  fetchAll: (params?: { search?: string; is_active?: boolean; use_type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
    if (params?.use_type) searchParams.set('use_type', params.use_type);
    const qs = searchParams.toString();
    return fetchWithAuth(`/auth/admin/plans/${qs ? `?${qs}` : ''}`);
  },
  fetchDetail: (id: number) => fetchWithAuth(`/auth/admin/plans/${id}/`),
  create: (data: any) => fetchWithAuth('/auth/admin/plans/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchWithAuth(`/auth/admin/plans/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchWithAuth(`/auth/admin/plans/${id}/`, { method: 'DELETE' }),
};

export const FeatureService = {
  fetchAll: (params?: { search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return fetchWithAuth(`/auth/admin/features/${qs ? `?${qs}` : ''}`);
  },
  fetchDetail: (id: number) => fetchWithAuth(`/auth/admin/features/${id}/`),
  create: (data: { text: string; order: number }) => fetchWithAuth('/auth/admin/features/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { text?: string; order?: number }) => fetchWithAuth(`/auth/admin/features/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchWithAuth(`/auth/admin/features/${id}/`, { method: 'DELETE' }),
};

export const UserService = {
  fetchAll: (params?: { 
    page?: number; 
    page_size?: number; 
    search?: string; 
    role?: string; 
    user_type?: string; 
    is_active?: boolean;
    organisation?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.user_type) searchParams.set('user_type', params.user_type);
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
    if (params?.organisation) searchParams.set('organisation', params.organisation);
    const qs = searchParams.toString();
    return fetchWithAuth(`/auth/admin/users/${qs ? `?${qs}` : ''}`);
  },
  fetchDetail: (id: number) => fetchWithAuth(`/auth/admin/users/${id}/`),
  create: (data: any) => fetchWithAuth('/auth/admin/users/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchWithAuth(`/auth/admin/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchWithAuth(`/auth/admin/users/${id}/`, { method: 'DELETE' }),
};

export const PaymentService = {
  fetchPayments: (params?: { 
    page?: number; 
    page_size?: number; 
    search?: string; 
    status?: string; 
    payment_type?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.payment_type) searchParams.set('payment_type', params.payment_type);
    const qs = searchParams.toString();
    return fetchWithAuth(`/payments/admin/payments/${qs ? `?${qs}` : ''}`);
  },
  fetchInvoices: (params?: { 
    page?: number; 
    page_size?: number; 
    search?: string; 
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return fetchWithAuth(`/payments/admin/invoices/${qs ? `?${qs}` : ''}`);
  },
  fetchAudits: (params?: { 
    page?: number; 
    page_size?: number; 
    payment?: string;
    subscription?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.payment) searchParams.set('payment', params.payment);
    if (params?.subscription) searchParams.set('subscription', params.subscription);
    const qs = searchParams.toString();
    return fetchWithAuth(`/payments/admin/audits/${qs ? `?${qs}` : ''}`);
  },
  fetchAnalytics: (params?: { start_date?: string; end_date?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    const qs = searchParams.toString();
    return fetchWithAuth(`/payments/admin/payments/analytics/${qs ? `?${qs}` : ''}`);
  },
  exportPayments: async (params?: { 
    search?: string; 
    status?: string; 
    payment_type?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.payment_type) searchParams.set('payment_type', params.payment_type);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/payments/admin/payments/export/${qs ? `?${qs}` : ''}`;
    
    // For downloads, we use window.open or a direct fetch with blob handling
    const tokensStr = localStorage.getItem('tokens');
    let accessToken = '';
    if (tokensStr) {
      try { accessToken = JSON.parse(tokensStr)?.access; } catch (e) {}
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export const AdminModelConfigService = {
  fetchAll: () => fetchWithAuth('/tools/admin/models/'),
  fetchDetail: (id: number) => fetchWithAuth(`/tools/admin/models/${id}/`),
  create: (data: any) => fetchWithAuth('/tools/admin/models/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchWithAuth(`/tools/admin/models/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchWithAuth(`/tools/admin/models/${id}/`, { method: 'DELETE' }),
};
