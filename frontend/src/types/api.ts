export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  users?: any[];
  disasters?: any[];
  disaster?: any;
  alerts?: any[];
  alert?: any;
  shelters?: any[];
  shelter?: any;
  resources?: any[];
  resource?: any;
  persons?: any[];
  person?: any;
  teams?: any[];
  team?: any;
  volunteers?: any[];
  volunteer?: any;
  stats?: any;
  data?: T;
  total?: number;
  page?: number;
  errors?: Array<{ field: string; message: string }>;
  [key: string]: any;
}

export interface QueryParams {
  search?: string;
  status?: string;
  type?: string;
  severity?: string;
  priority?: string;
  gender?: string;
  vehicleType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export interface UserDTO {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  district?: string;
  districtCode?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  role?: string;
  phone?: string;
  district?: string;
  countryCode?: string;
}

export interface DisasterPayload {
  name?: string;
  title?: string;
  type: string;
  severity: string;
  status: string;
  location?: { lat: number; lng: number; address: string };
  affectedRadius?: number;
  affectedCount?: number;
  description?: string;
  [key: string]: any;
}

export interface SOSPayload {
  type?: string;
  priority?: string;
  status?: string;
  country?: string;
  state?: string;
  district?: string;
  location?: { lat: number; lng: number; address: string };
  message?: string;
  contactPhone?: string;
  countryCode?: string;
  numberOfPeople?: number;
  [key: string]: any;
}

export interface ShelterPayload {
  name: string;
  type: string;
  capacity: number;
  currentOccupancy?: number;
  status: string;
  location?: { lat: number; lng: number; address: string };
  contactPhone?: string;
  countryCode?: string;
  managerName?: string;
  facilities?: Record<string, boolean>;
  [key: string]: any;
}

export interface MissingPersonPayload {
  name: string;
  age?: number;
  gender: string;
  status: string;
  lastSeenLocation?: { lat: number; lng: number; address: string };
  contactPhone?: string;
  countryCode?: string;
  distinguishingFeatures?: string;
  photoUrl?: string;
  [key: string]: any;
}

export interface VolunteerPayload {
  isAvailable?: boolean;
  skills: string[];
  experience?: string;
  location?: { lat: number; lng: number; address: string };
  [key: string]: any;
}

export interface RescueTeamPayload {
  name: string;
  leaderName?: string;
  contactPhone: string;
  countryCode?: string;
  membersCount?: number;
  capacity?: number;
  vehicleType: string;
  vehicleNumber?: string;
  specialization: string[];
  status: string;
  [key: string]: any;
}

export interface ResourcePayload {
  name: string;
  type: string;
  quantity: number;
  unit?: string;
  status: string;
  providedBy?: string;
  location?: { lat: number; lng: number; address: string };
  [key: string]: any;
}

export interface AlertPayload {
  title: string;
  message: string;
  severity?: string;
  type?: string;
  targetCountry?: string;
  targetState?: string;
  targetDistrict?: string;
  sendSMS?: boolean;
  area?: string;
  expiresAt?: string;
  [key: string]: any;
}
