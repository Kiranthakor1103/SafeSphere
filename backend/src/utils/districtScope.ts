import { AuthRequest } from '../middleware/auth';
import { normalizeRole } from '../config/permissions';
import { AppError } from '../middleware/errorHandler';
import { generateDistrictCode } from './districtHelper';

/**
 * Returns true if user is super admin / nationwide admin who has global access across all districts
 */
export const isGlobalAdmin = (req: AuthRequest): boolean => {
  if (!req.user) return false;
  const normalized = normalizeRole(req.user.role);
  return normalized === 'super_admin' || req.user.role === 'super_admin' || req.user.role === 'admin';
};

/**
 * Gets assigned district unique ID & district name for the authenticated user
 */
export const getUserDistrictInfo = (req: AuthRequest): { districtName: string; districtCode: string } => {
  if (!req.user || isGlobalAdmin(req)) {
    return { districtName: '', districtCode: '' };
  }

  let districtName = req.user.district ? req.user.district.trim() : '';
  if (!districtName || districtName.toLowerCase().startsWith('select')) {
    if (req.user.location?.address) {
      districtName = req.user.location.address.split(',')[0].trim();
    }
  }

  const countryName = req.user.country || 'India';
  const stateName = req.user.state || 'Gujarat';

  let districtCode = req.user.districtCode || '';
  if (!districtCode && districtName) {
    districtCode = generateDistrictCode(countryName, stateName, districtName);
  }

  return { districtName, districtCode };
};

/**
 * Convenience helper to get user's district name (for backward compatibility)
 */
export const getUserDistrict = (req: AuthRequest): string => {
  return getUserDistrictInfo(req).districtName;
};

/**
 * Applies district unique ID & text scoping to Mongoose queries based on the user's assigned district.
 * Super Admins see all nationwide data.
 * District Admins & Regional Officers see data matching their assigned District Unique ID (e.g. IN-GJ-AHMEDABAD).
 */
export const applyDistrictScope = (req: AuthRequest, baseQuery: any = {}): any => {
  const user = req.user;
  if (!user || isGlobalAdmin(req)) return baseQuery;

  const { districtName, districtCode } = getUserDistrictInfo(req);

  if (districtCode || districtName) {
    const districtRegex = districtName ? new RegExp(districtName, 'i') : null;

    const districtOrFilters: any[] = [];

    // Exact Unique District Code Match
    if (districtCode) {
      districtOrFilters.push({ districtCode: districtCode });
      districtOrFilters.push({ targetDistrictCode: districtCode });
      districtOrFilters.push({ assignedDistrictCode: districtCode });
    }

    // Name & Address Regex Fallback Match
    if (districtRegex) {
      districtOrFilters.push(
        { district: districtRegex },
        { targetDistrict: districtRegex },
        { assignedDistrict: districtRegex },
        { 'location.address': districtRegex },
        { affectedArea: districtRegex },
        { area: districtRegex },
        { address: districtRegex },
        { 'lastSeenLocation.address': districtRegex }
      );
    }

    const districtFilter = { $or: districtOrFilters };

    if (Object.keys(baseQuery).length === 0) {
      return districtFilter;
    }

    return {
      $and: [baseQuery, districtFilter]
    };
  }

  return baseQuery;
};

/**
 * Ensures newly created records are automatically assigned to the District Admin's unique district ID.
 */
export const enforceDistrictCreation = (req: AuthRequest, body: any): any => {
  if (!req.user || isGlobalAdmin(req)) return body;

  const { districtName, districtCode } = getUserDistrictInfo(req);

  if (districtName) {
    if (!body.district || body.district.toLowerCase().startsWith('select')) {
      body.district = districtName;
    }
    if ((!body.state || body.state.toLowerCase().startsWith('select')) && req.user.state) {
      body.state = req.user.state;
    }
    if ((!body.country || body.country.toLowerCase().startsWith('select')) && req.user.country) {
      body.country = req.user.country;
    }
  }

  const computedCode = body.districtCode || generateDistrictCode(
    body.country || req.user.country || 'India',
    body.state || req.user.state || 'Gujarat',
    body.district || districtName
  );

  body.districtCode = computedCode || districtCode;
  return body;
};

/**
 * Validates whether a single document belongs to the requesting user's assigned unique district ID.
 * Throws a 403 Forbidden error if the document falls outside their assigned district.
 */
export const verifyDistrictOwnership = (req: AuthRequest, doc: any, docName = 'Resource'): void => {
  if (!req.user || isGlobalAdmin(req) || !doc) return;

  const { districtName, districtCode } = getUserDistrictInfo(req);
  if (!districtCode && !districtName) return;

  // 1. Check exact unique ID match if available
  const docCode = doc.districtCode || doc.targetDistrictCode || doc.assignedDistrictCode || '';
  if (districtCode && docCode) {
    if (docCode.toUpperCase() === districtCode.toUpperCase()) {
      return; // Exact Unique ID Match! Authorized.
    }
  }

  // 2. Fallback check name match
  const userDistLower = districtName.toLowerCase();
  const docDist = (
    doc.district ||
    doc.targetDistrict ||
    doc.assignedDistrict ||
    doc.location?.address ||
    doc.affectedArea ||
    doc.area ||
    doc.address ||
    doc.lastSeenLocation?.address ||
    ''
  ).toString().toLowerCase();

  if (docDist && !docDist.includes(userDistLower)) {
    throw new AppError(
      `Access Denied: You can only view or manage ${docName} records within your assigned district [Unique ID: ${districtCode || districtName}].`,
      403
    );
  }
};


