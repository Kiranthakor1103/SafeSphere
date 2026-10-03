import { Request, Response, NextFunction } from 'express';
import { getAIChatResponse, analyzeSOSTriage } from '../services/aiService';
import Shelter from '../models/Shelter';
import Disaster from '../models/Disaster';
import SOSAlert from '../models/SOSAlert';

export const chatWithAI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const message = req.body.message || req.body.prompt;
    const contextData = req.body.contextData;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'Field "message" or "prompt" string is required.' });
      return;
    }

    // Gather database metrics for contextual awareness
    const activeDisasters = await Disaster.countDocuments({ status: 'active' });
    const shelterCount = await Shelter.countDocuments({ status: 'open' });

    const mergedContext = {
      activeDisasters,
      shelterCount,
      ...contextData
    };

    const reply = await getAIChatResponse(message, mergedContext);
    res.json({
      success: true,
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

export const triageSOS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let sosData = req.body.sosData || req.body;

    // If an sosId is passed, fetch the real record from DB
    if (req.body.sosId || req.params.id) {
      const targetId = req.body.sosId || req.params.id;
      const foundAlert = await SOSAlert.findById(targetId);
      if (foundAlert) {
        sosData = foundAlert.toObject();
      }
    }

    if (!sosData || (!sosData.message && !sosData.type)) {
      res.status(400).json({ success: false, message: 'Valid SOS payload or sosId is required for AI Triage.' });
      return;
    }

    const triageResult = await analyzeSOSTriage(sosData);
    res.json({
      success: true,
      triage: triageResult,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

export const recommendShelter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { district, state, numberOfPeople = 1 } = req.body;

    const filter: any = { status: 'open' };
    if (district && district !== 'Select District / Region') {
      filter.district = new RegExp(district, 'i');
    } else if (state && state !== 'Select State') {
      filter.state = new RegExp(state, 'i');
    }

    const shelters = await Shelter.find(filter).lean();
    
    // Sort shelters by available capacity (capacity - currentOccupancy)
    const availableShelters = shelters
      .map(s => {
        const availableSpace = Math.max(0, (s.capacity || 0) - (s.currentOccupancy || 0));
        return {
          ...s,
          availableSpace,
          isSuitable: availableSpace >= numberOfPeople
        };
      })
      .sort((a, b) => b.availableSpace - a.availableSpace);

    const recommended = availableShelters.find(s => s.isSuitable) || availableShelters[0] || null;

    res.json({
      success: true,
      recommendedShelter: recommended,
      matches: availableShelters.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};
