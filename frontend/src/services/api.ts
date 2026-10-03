import axios, { AxiosResponse } from 'axios';
import {
  ApiResponse,
  QueryParams,
  LoginPayload,
  RegisterPayload,
  DisasterPayload,
  SOSPayload,
  ShelterPayload,
  MissingPersonPayload,
  VolunteerPayload,
  RescueTeamPayload,
  ResourcePayload,
  AlertPayload,
} from '../types/api';

const API = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('dc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const requestUrl = err.config?.url || '';
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthRequest && !isAuthPage) {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const loginAPI = (data: LoginPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/auth/login', data);
export const registerAPI = (data: RegisterPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/auth/register', data);
export const getMeAPI = (): Promise<AxiosResponse<ApiResponse>> => API.get('/auth/me');
export const updateMeAPI = (data: any): Promise<AxiosResponse<ApiResponse>> => API.put('/auth/me', data);
export const getUsersAPI = (params?: QueryParams): Promise<AxiosResponse<ApiResponse>> => API.get('/auth/users', { params });
export const updateUserAPI = (id: string, data: any): Promise<AxiosResponse<ApiResponse>> => API.put(`/auth/users/${id}`, data);
export const deleteUserAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/auth/users/${id}`);

// Disasters
export const getDisastersAPI = (params?: QueryParams): Promise<AxiosResponse<ApiResponse>> => API.get('/disasters', { params });
export const getDisasterAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.get(`/disasters/${id}`);
export const createDisasterAPI = (data: DisasterPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/disasters', data);
export const updateDisasterAPI = (id: string, data: Partial<DisasterPayload>): Promise<AxiosResponse<ApiResponse>> => API.put(`/disasters/${id}`, data);
export const deleteDisasterAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/disasters/${id}`);

// SOS
export const getSOSAlertsAPI = (params?: QueryParams): Promise<AxiosResponse<ApiResponse>> => API.get('/sos', { params });
export const getNearestSOSAPI = (lat: number, lng: number, radiusKm: number = 25): Promise<AxiosResponse<ApiResponse>> => API.get('/sos/nearest', { params: { lat, lng, radiusKm } });
export const createSOSAlertAPI = (data: SOSPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/sos', data);
export const dispatchTeamAPI = (sosId: string, teamId: string): Promise<AxiosResponse<ApiResponse>> => API.post(`/sos/${sosId}/dispatch`, { teamId });
export const updateSOSAlertAPI = (id: string, data: Partial<SOSPayload>): Promise<AxiosResponse<ApiResponse>> => API.put(`/sos/${id}`, data);
export const deleteSOSAlertAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/sos/${id}`);

// Shelters
export const getSheltersAPI = (params?: QueryParams): Promise<AxiosResponse<ApiResponse>> => API.get('/shelters', { params });
export const getNearestSheltersAPI = (lat: number, lng: number, radiusKm: number = 20, status: string = 'open'): Promise<AxiosResponse<ApiResponse>> => API.get('/shelters/nearest', { params: { lat, lng, radiusKm, status } });
export const createShelterAPI = (data: ShelterPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/shelters', data);
export const updateShelterAPI = (id: string, data: Partial<ShelterPayload>): Promise<AxiosResponse<ApiResponse>> => API.put(`/shelters/${id}`, data);
export const deleteShelterAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/shelters/${id}`);

// Missing Persons
export const getMissingPersonsAPI = (params?: QueryParams): Promise<AxiosResponse<ApiResponse>> => API.get('/missing-persons', { params });
export const createMissingPersonAPI = (data: MissingPersonPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/missing-persons', data);
export const updateMissingPersonAPI = (id: string, data: Partial<MissingPersonPayload>): Promise<AxiosResponse<ApiResponse>> => API.put(`/missing-persons/${id}`, data);
export const deleteMissingPersonAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/missing-persons/${id}`);

// Volunteers & Teams
export const getVolunteersAPI = (params?: QueryParams): Promise<AxiosResponse<ApiResponse>> => API.get('/teams/volunteers', { params });
export const createVolunteerAPI = (data: VolunteerPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/teams/volunteers', data);
export const updateVolunteerAPI = (id: string, data: Partial<VolunteerPayload>): Promise<AxiosResponse<ApiResponse>> => API.put(`/teams/volunteers/${id}`, data);
export const deleteVolunteerAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/teams/volunteers/${id}`);
export const unregisterVolunteerAPI = (): Promise<AxiosResponse<ApiResponse>> => API.post('/teams/volunteers/unregister');

export const getRescueTeamsAPI = (params?: QueryParams): Promise<AxiosResponse<ApiResponse>> => API.get('/teams/rescue-teams', { params });
export const getNearestTeamsAPI = (lat: number, lng: number, radiusKm: number = 25, status?: string): Promise<AxiosResponse<ApiResponse>> => API.get('/teams/rescue-teams/nearest', { params: { lat, lng, radiusKm, status } });
export const createRescueTeamAPI = (data: RescueTeamPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/teams/rescue-teams', data);
export const updateRescueTeamAPI = (id: string, data: Partial<RescueTeamPayload>): Promise<AxiosResponse<ApiResponse>> => API.put(`/teams/rescue-teams/${id}`, data);
export const deleteRescueTeamAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/teams/rescue-teams/${id}`);

// Resources
export const getResourcesAPI = (params?: QueryParams): Promise<AxiosResponse<ApiResponse>> => API.get('/resources', { params });
export const createResourceAPI = (data: ResourcePayload): Promise<AxiosResponse<ApiResponse>> => API.post('/resources', data);
export const updateResourceAPI = (id: string, data: Partial<ResourcePayload>): Promise<AxiosResponse<ApiResponse>> => API.put(`/resources/${id}`, data);
export const deleteResourceAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/resources/${id}`);

// Alerts
export const getAlertsAPI = (): Promise<AxiosResponse<ApiResponse>> => API.get('/alerts');
export const createAlertAPI = (data: AlertPayload): Promise<AxiosResponse<ApiResponse>> => API.post('/alerts', data);
export const updateAlertAPI = (id: string, data: Partial<AlertPayload>): Promise<AxiosResponse<ApiResponse>> => API.put(`/alerts/${id}`, data);
export const deleteAlertAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/alerts/${id}`);

// Analytics
export const getDashboardStatsAPI = (): Promise<AxiosResponse<ApiResponse>> => API.get('/analytics/dashboard');

// Upload
export const uploadImageAPI = (formData: FormData): Promise<AxiosResponse<ApiResponse>> =>
  API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// IoT Sensors & Live Telemetry
export const getIoTSensorsAPI = (): Promise<AxiosResponse<ApiResponse>> => API.get('/iot/sensors');
export const createIoTSensorAPI = (data: any): Promise<AxiosResponse<ApiResponse>> => API.post('/iot/sensors', data);
export const updateIoTSensorAPI = (id: string, data: any): Promise<AxiosResponse<ApiResponse>> => API.put(`/iot/sensors/${id}`, data);
export const deleteIoTSensorAPI = (id: string): Promise<AxiosResponse<ApiResponse>> => API.delete(`/iot/sensors/${id}`);
export const sendIoTTelemetryAPI = (data: any): Promise<AxiosResponse<ApiResponse>> => API.post('/iot/telemetry', data);

// AI Integration Services
export const chatWithAIAPI = (message: string, contextData?: any): Promise<AxiosResponse<ApiResponse>> => API.post('/ai/chat', { message, contextData });
export const triageSOSAPI = (sosDataOrId: any): Promise<AxiosResponse<ApiResponse>> => API.post('/ai/triage', typeof sosDataOrId === 'string' ? { sosId: sosDataOrId } : { sosData: sosDataOrId });
export const recommendShelterAPI = (locationData: any): Promise<AxiosResponse<ApiResponse>> => API.post('/ai/recommend-shelter', locationData);

export default API;
