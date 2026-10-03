import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getDistrictsWithUniqueIds, getDistrictInfo, generateDistrictCode } from '../utils/districtHelper';
import Disaster from '../models/Disaster';
import SOSAlert from '../models/SOSAlert';
import Shelter from '../models/Shelter';
import RescueTeam from '../models/RescueTeam';

/**
 * GET /api/districts
 * Lists districts with unique IDs and summary metrics
 */
export const getDistrictsList = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { country = 'India', state = 'Gujarat' } = req.query;
  const districts = getDistrictsWithUniqueIds(String(country), String(state));

  // Compute active asset counts for each district
  const enriched = await Promise.all(
    districts.map(async (d) => {
      const regex = new RegExp(d.districtName, 'i');
      const [disastersCount, sosCount, shelterCount, teamCount] = await Promise.all([
        Disaster.countDocuments({ $or: [{ districtCode: d.uniqueId }, { district: regex }, { 'location.address': regex }] }),
        SOSAlert.countDocuments({ status: { $in: ['pending', 'assigned', 'in_progress'] }, $or: [{ districtCode: d.uniqueId }, { district: regex }, { 'location.address': regex }] }),
        Shelter.countDocuments({ status: 'open', $or: [{ districtCode: d.uniqueId }, { district: regex }, { 'location.address': regex }] }),
        RescueTeam.countDocuments({ $or: [{ districtCode: d.uniqueId }, { district: regex }, { 'location.address': regex }] })
      ]);

      return {
        ...d,
        activeDisasters: disastersCount,
        activeSOSAlerts: sosCount,
        openShelters: shelterCount,
        totalRescueTeams: teamCount
      };
    })
  );

  res.json({ success: true, count: enriched.length, country, state, districts: enriched });
});

/**
 * GET /api/districts/lookup
 * Generates or validates a unique district ID for a given country, state, district name
 */
export const lookupDistrictCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { country = 'India', state = 'Gujarat', district = 'Ahmedabad' } = req.query;
  const info = getDistrictInfo(String(country), String(state), String(district));
  res.json({ success: true, ...info });
});
