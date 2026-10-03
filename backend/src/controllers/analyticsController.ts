import { Request, Response } from 'express';
import Disaster from '../models/Disaster';
import SOSAlert from '../models/SOSAlert';
import Shelter from '../models/Shelter';
import MissingPerson from '../models/MissingPerson';
import Volunteer from '../models/Volunteer';
import RescueTeam from '../models/RescueTeam';
import User from '../models/User';
import Resource from '../models/Resource';
import { normalizeRole } from '../config/permissions';
import { applyDistrictScope } from '../utils/districtScope';
import { asyncHandler } from '../utils/asyncHandler';

export const getDashboardStats = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const isPersonalDashboard = ['citizen', 'volunteer'].includes(normalizeRole(req.user?.role) || '');
  const sosBaseFilter = isPersonalDashboard ? { userId: req.user._id } : {};

  const disasterFilter = applyDistrictScope(req, {});
  const activeDisasterFilter = applyDistrictScope(req, { status: 'active' });
  const criticalDisasterFilter = applyDistrictScope(req, { severity: 'critical' });

  const sosFilter = applyDistrictScope(req, sosBaseFilter);
  const pendingSOSFilter = applyDistrictScope(req, { ...sosBaseFilter, status: 'pending' });
  const resolvedSOSFilter = applyDistrictScope(req, { ...sosBaseFilter, status: 'resolved' });

  const shelterFilter = applyDistrictScope(req, {});
  const openShelterFilter = applyDistrictScope(req, { status: 'open' });

  const missingFilter = applyDistrictScope(req, {});
  const foundMissingFilter = applyDistrictScope(req, { status: 'found' });

  const volunteerFilter = applyDistrictScope(req, {});
  const availableVolunteerFilter = applyDistrictScope(req, { isAvailable: true });

  const teamFilter = applyDistrictScope(req, {});
  const deployedTeamFilter = applyDistrictScope(req, { status: 'deployed' });

  const userFilter = applyDistrictScope(req, {});
  const resourceFilter = applyDistrictScope(req, {});

  const [
    totalDisasters, activeDisasters, criticalDisasters,
    totalSOS, pendingSOS, resolvedSOS,
    totalShelters, openShelters,
    totalMissing, foundPersons,
    totalVolunteers, availableVolunteers,
    totalTeams, deployedTeams,
    totalUsers, totalResources,
  ] = await Promise.all([
    Disaster.countDocuments(disasterFilter),
    Disaster.countDocuments(activeDisasterFilter),
    Disaster.countDocuments(criticalDisasterFilter),
    SOSAlert.countDocuments(sosFilter),
    SOSAlert.countDocuments(pendingSOSFilter),
    SOSAlert.countDocuments(resolvedSOSFilter),
    Shelter.countDocuments(shelterFilter),
    Shelter.countDocuments(openShelterFilter),
    MissingPerson.countDocuments(missingFilter),
    MissingPerson.countDocuments(foundMissingFilter),
    Volunteer.countDocuments(volunteerFilter),
    Volunteer.countDocuments(availableVolunteerFilter),
    RescueTeam.countDocuments(teamFilter),
    RescueTeam.countDocuments(deployedTeamFilter),
    User.countDocuments(userFilter),
    Resource.countDocuments(resourceFilter),
  ]);

  const recentDisasters = await Disaster.find(disasterFilter)
    .sort({ createdAt: -1 }).limit(5)
    .select('title type severity status location createdAt');

  const recentSOS = await SOSAlert.find(sosFilter)
    .sort({ createdAt: -1 }).limit(5)
    .populate('userId', 'name phone')
    .select('type priority status location message createdAt');

  const disastersByType = await Disaster.aggregate([
    { $match: disasterFilter },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  const sosByPriority = await SOSAlert.aggregate([
    { $match: sosFilter },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    stats: {
      disasters: { total: totalDisasters, active: activeDisasters, critical: criticalDisasters },
      sos: { total: totalSOS, pending: pendingSOS, resolved: resolvedSOS },
      shelters: { total: totalShelters, open: openShelters },
      missingPersons: { total: totalMissing, found: foundPersons, missing: totalMissing - foundPersons },
      volunteers: { total: totalVolunteers, available: availableVolunteers },
      rescueTeams: { total: totalTeams, deployed: deployedTeams },
      users: { total: totalUsers },
      resources: { total: totalResources },
    },
    recentDisasters,
    recentSOS,
    charts: { disastersByType, sosByPriority }
  });
});
