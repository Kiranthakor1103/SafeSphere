import { useAuth } from '../context/AuthContext';
import { generateDistrictCode } from '../utils/locationData';

export interface DistrictScopeInfo {
  /** The current user's assigned district unique ID (e.g. "IN-DL-NEW-DELHI") */
  districtCode: string;
  /** The human-readable district name (e.g. "New Delhi") */
  districtName: string;
  /** The state name (e.g. "Delhi") */
  stateName: string;
  /** The country name (e.g. "India") */
  countryName: string;
  /** Whether the current user is a Super Admin / Global Admin with no district restriction */
  isGlobal: boolean;
  /** Whether the current user is a district-scoped regional admin */
  isDistrictAdmin: boolean;
}

const GLOBAL_ROLES = ['super_admin', 'admin'];

/**
 * Hook to get the current user's district scoping information
 * Use this to display the district badge, restrict dropdowns, and filter API calls
 */
export const useDistrictScope = (): DistrictScopeInfo => {
  const { user } = useAuth();

  if (!user) {
    return {
      districtCode: '',
      districtName: '',
      stateName: '',
      countryName: '',
      isGlobal: false,
      isDistrictAdmin: false
    };
  }

  const isGlobal = GLOBAL_ROLES.includes(user.role);
  const isDistrictAdmin = ['district_admin', 'shelter_manager', 'rescue_team', 'volunteer', 'ngo'].includes(user.role);

  const districtName = user.district || '';
  const stateName = user.state || '';
  const countryName = user.country || 'India';

  // Use stored code from backend or compute it from names
  const districtCode =
    user.districtCode ||
    (districtName ? generateDistrictCode(countryName, stateName, districtName) : '');

  return {
    districtCode,
    districtName,
    stateName,
    countryName,
    isGlobal,
    isDistrictAdmin
  };
};

/**
 * Returns true if the current user can access data from a given district code
 */
export const useCanAccessDistrict = (targetDistrictCode: string): boolean => {
  const { isGlobal, districtCode } = useDistrictScope();
  if (isGlobal || !districtCode) return true;
  if (!targetDistrictCode) return true;
  return districtCode.toUpperCase() === targetDistrictCode.toUpperCase();
};
