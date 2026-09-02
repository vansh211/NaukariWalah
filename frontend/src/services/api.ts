const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type only if not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || 'An error occurred with the request');
  }

  return data as T;
}

export const api = {
  // Auth
  signup: (body: any) => request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  demoLogin: (role: 'candidate' | 'recruiter') =>
    request<any>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (body: any) => request<any>('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  // Jobs
  getJobs: (params?: { search?: string; location?: string; skill?: string; type?: string; minExp?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.location) query.append('location', params.location);
    if (params?.skill) query.append('skill', params.skill);
    if (params?.type) query.append('type', params.type);
    if (params?.minExp) query.append('minExp', params.minExp);
    return request<any>(`/jobs?${query.toString()}`);
  },
  getRecommendations: () => request<any>('/jobs/recommendations'),
  getJobById: (id: string) => request<any>(`/jobs/${id}`),
  getMyPostedJobs: () => request<any>('/jobs/my/posted'),
  createJob: (body: any) => request<any>('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  updateJob: (id: string, body: any) => request<any>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteJob: (id: string) => request<any>(`/jobs/${id}`, { method: 'DELETE' }),

  // Resumes
  uploadResume: (formData: FormData) => request<any>('/resumes/upload', { method: 'POST', body: formData }),
  getMyResume: () => request<any>('/resumes/me'),
  updateResume: (body: any) => request<any>('/resumes/me', { method: 'PUT', body: JSON.stringify(body) }),
  getAIFeedback: () => request<any>('/resumes/ai-feedback', { method: 'POST' }),
  getCandidateResume: (id: string) => request<any>(`/resumes/user/${id}`),

  // Applications
  applyToJob: (jobId: string) => request<any>('/applications', { method: 'POST', body: JSON.stringify({ jobId }) }),
  getMyApplications: () => request<any>('/applications/me'),
  getJobApplications: (jobId: string) => request<any>(`/applications/job/${jobId}`),
  updateApplicationStatus: (id: string, status: string, recruiterNotes?: string) =>
    request<any>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, recruiterNotes }),
    }),

  // Candidates Search (Recruiter)
  searchCandidates: (params?: { skill?: string; title?: string; minExp?: string; location?: string }) => {
    const query = new URLSearchParams();
    if (params?.skill) query.append('skill', params.skill);
    if (params?.title) query.append('title', params.title);
    if (params?.minExp) query.append('minExp', params.minExp);
    if (params?.location) query.append('location', params.location);
    return request<any>(`/candidates/search?${query.toString()}`);
  },

  // Extras
  getSavedJobs: () => request<any>('/extras/saved-jobs'),
  toggleSaveJob: (jobId: string) => request<any>(`/extras/saved-jobs/${jobId}`, { method: 'POST' }),
  getNotifications: () => request<any>('/extras/notifications'),
  markNotificationsRead: () => request<any>('/extras/notifications/mark-read', { method: 'PATCH' }),
  getStats: () => request<any>('/extras/stats'),
};
