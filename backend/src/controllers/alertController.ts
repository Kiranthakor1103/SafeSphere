import { Request, Response } from 'express';
import Alert from '../models/Alert';
import AuditLog from '../models/AuditLog';
import { applyDistrictScope, enforceDistrictCreation, verifyDistrictOwnership, getUserDistrict, isGlobalAdmin } from '../utils/districtScope';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { sendRegionalSMSAlert } from '../services/smsService';

export const getAlerts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let filter: any = { isActive: true };
  filter = applyDistrictScope(req as any, filter);

  const alerts = await Alert.find(filter)
    .populate('disasterId', 'title type')
    .populate('issuedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, alerts });
});

export const createAlert = asyncHandler(async (req: any, res: Response): Promise<void> => {
  let { title, message, type, targetCountry, targetState, targetDistrict, sendSMS } = req.body;

  // Auto-scope broadcast target if created by a District Admin
  const userDist = getUserDistrict(req);
  if (userDist && !isGlobalAdmin(req)) {
    if (!targetDistrict || targetDistrict.toLowerCase().startsWith('select')) {
      targetDistrict = userDist;
    }
    if ((!targetState || targetState.toLowerCase().startsWith('select')) && req.user.state) {
      targetState = req.user.state;
    }
    if ((!targetCountry || targetCountry.toLowerCase().startsWith('select')) && req.user.country) {
      targetCountry = req.user.country;
    }
  }

  // 1. Instantly save Alert to MongoDB
  const alert = await Alert.create({
    title,
    message,
    type: type || 'warning',
    targetCountry: targetCountry || 'Select Country',
    targetState: targetState || 'Select State',
    targetDistrict: targetDistrict || 'Select District / Region',
    sendSMS: !!sendSMS,
    issuedBy: req.user._id
  });

  const populated = await Alert.findById(alert._id)
    .populate('disasterId', 'title type')
    .populate('issuedBy', 'name');

  const alertObj = populated ? populated.toObject() : alert.toObject();

  // 2. 🚀 INSTANT 0ms REAL-TIME WEBSOCKET BROADCAST (Zero Delay for Life Safety!)
  if (req.io) {
    const payload = {
      ...alertObj,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    };

    // Global instant broadcast
    req.io.emit('alert:broadcast', payload);

    // Targeted regional socket room dispatch
    if (targetCountry && !targetCountry.toLowerCase().startsWith('select')) {
      req.io.to(`country:${targetCountry.toLowerCase()}`).emit('alert:regional', payload);
    }
    if (targetState && !targetState.toLowerCase().startsWith('select')) {
      req.io.to(`state:${targetState.toLowerCase()}`).emit('alert:regional', payload);
    }
    if (targetDistrict && !targetDistrict.toLowerCase().startsWith('select')) {
      req.io.to(`district:${targetDistrict.toLowerCase()}`).emit('alert:regional', payload);
    }

    req.io.emit('stats:updated');
  }

  // 3. Return HTTP 201 response back to UI instantly (Zero UI lag)
  res.status(201).json({
    success: true,
    message: 'Emergency alert broadcasted instantly in real-time!',
    alert: populated || alert
  });

  // 4. ⚡ Asynchronous (Non-blocking) Background SMS Dispatch & Audit Logging
  (async () => {
    try {
      let smsResult = null;
      if (sendSMS) {
        smsResult = await sendRegionalSMSAlert(
          targetDistrict || 'Select District / Region',
          title,
          message,
          targetState || 'Select State',
          targetCountry || 'Select Country'
        );
      }

      await AuditLog.create({
        action: sendSMS ? 'ALERT_BROADCAST_WITH_SMS' : 'ALERT_BROADCAST',
        userId: req.user._id,
        resource: 'Alert',
        resourceId: alert._id,
        details: `Scope: ${targetCountry || 'Select Country'} > ${targetState || 'Select State'} > ${targetDistrict || 'Select District / Region'}, SMS Recipients: ${smsResult ? smsResult.recipientCount : 0}`,
        ipAddress: req.ip || ''
      });

      if (smsResult && req.io) {
        req.io.emit('alert:sms_dispatched', {
          alertId: alert._id,
          recipientCount: smsResult.recipientCount,
          targetDistrict: smsResult.targetDistrict
        });
      }
    } catch (bgError) {}
  })();
});

export const updateAlert = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await Alert.findById(req.params.id);
  if (!existing) {
    throw new AppError('Alert not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Alert');

  const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('disasterId', 'title type')
    .populate('issuedBy', 'name');

  await AuditLog.create({
    action: 'ALERT_UPDATED',
    userId: req.user._id,
    resource: 'Alert',
    resourceId: alert!._id,
    details: `Alert updated: "${alert!.title}"`,
    ipAddress: req.ip || ''
  });

  if (req.io) {
    req.io.emit('alert:updated', {
      ...alert!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
  }

  res.json({ success: true, message: 'Alert updated.', alert });
});

export const deleteAlert = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) {
    throw new AppError('Alert not found.', 404);
  }
  verifyDistrictOwnership(req, alert, 'Alert');

  await Alert.findByIdAndDelete(req.params.id);

  await AuditLog.create({
    action: 'ALERT_DELETED',
    userId: req.user._id,
    resource: 'Alert',
    resourceId: alert._id,
    details: `Alert deleted: "${alert.title}"`,
    ipAddress: req.ip || ''
  });

  if (req.io) {
    req.io.emit('alert:deleted', {
      _id: req.params.id,
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
  }

  res.json({ success: true, message: 'Alert deleted.' });
});

export const deactivateAlert = asyncHandler(async (req: any, res: Response): Promise<void> => {
  const existing = await Alert.findById(req.params.id);
  if (!existing) {
    throw new AppError('Alert not found.', 404);
  }
  verifyDistrictOwnership(req, existing, 'Alert');

  const alert = await Alert.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    .populate('disasterId', 'title type')
    .populate('issuedBy', 'name');

  await AuditLog.create({
    action: 'ALERT_DEACTIVATED',
    userId: req.user._id,
    resource: 'Alert',
    resourceId: alert!._id,
    details: `Alert deactivated: "${alert!.title}"`,
    ipAddress: req.ip || ''
  });

  if (req.io) {
    req.io.emit('alert:deactivated', {
      ...alert!.toObject(),
      performedBy: { name: req.user.name, email: req.user.email, role: req.user.role }
    });
  }

  res.json({ success: true, message: 'Alert deactivated.', alert });
});
