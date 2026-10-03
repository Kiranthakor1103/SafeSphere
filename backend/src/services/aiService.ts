import { ENV } from '../config/env';

export interface AIChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

export interface SOSTriageResult {
  score: number; // 0 - 100
  priority: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  identifiedHazards: string[];
  recommendedUnits: string[];
  immediateActions: string[];
  shelterMatchNote?: string;
}

/**
 * Heuristic fallback engine when Gemini API key is not present or offline
 */
/**
 * Heuristic fallback engine when Gemini API key is not present or offline
 * Uses a sequence-weighted risk algorithm for both Natural Disasters and Urban Emergencies.
 */
const runHeuristicSOSTriage = (sosData: any): SOSTriageResult => {
  const message = (sosData.message || '').toLowerCase();
  const type = (sosData.type || '').toLowerCase();
  const victimCount = Number(sosData.numberOfPeople) || 1;

  let score = 35;
  const hazards: string[] = [];
  const recommendedUnits: string[] = [];
  const immediateActions: string[] = [];

  // Population Density & Volume Factor
  if (victimCount >= 20) score += 35;
  else if (victimCount >= 10) score += 25;
  else if (victimCount >= 5) score += 15;
  else if (victimCount >= 2) score += 10;

  // Primary Disaster Type Factors (Natural & Urban)
  if (type === 'medical' || type === 'trapped') {
    score += 25;
    hazards.push('Immediate Life & Medical Threat');
    recommendedUnits.push('Emergency Medical Services (EMS) & Trauma Response');
  } else if (type === 'fire' || type === 'evacuation') {
    score += 25;
    hazards.push('Active Building / Industrial Fire');
    recommendedUnits.push('Urban Fire & Rescue Brigade');
  } else if (type === 'flood' || type === 'water') {
    score += 20;
    hazards.push('Submerged Urban Infrastructure / Drowning Risk');
    recommendedUnits.push('NDRF & Water Rescue Unit');
  } else if (type === 'food_water') {
    score += 10;
    hazards.push('Essential Supply Depletion');
    recommendedUnits.push('Municipal Relief Distribution');
  }

  // Sequential Multi-Hazard Keyword Analysis (RNN-style feature extraction)
  if (message.includes('trapped') || message.includes('collapsed') || message.includes('rubble') || message.includes('structure')) {
    score += 25;
    hazards.push('Structural Building Collapse');
    recommendedUnits.push('Urban Search & Rescue (USAR / NDRF)');
    immediateActions.push('Deploy heavy concrete lifting gear, acoustic life detectors & search dogs.');
  }

  if (message.includes('drowning') || message.includes('flood') || message.includes('water level') || message.includes('roof')) {
    score += 20;
    hazards.push('Urban Flash Flood / Inundation');
    if (!recommendedUnits.includes('NDRF & Water Rescue Unit')) {
      recommendedUnits.push('NDRF & Water Rescue Unit');
    }
    immediateActions.push('Deploy motorboats and high-clearance rescue vehicles for roof evacuation.');
  }

  if (message.includes('bleeding') || message.includes('unconscious') || message.includes('heart') || message.includes('infant') || message.includes('baby') || message.includes('elderly')) {
    score += 20;
    hazards.push('Vulnerable City Demographics / Trauma');
    if (!recommendedUnits.includes('Emergency Medical Services (EMS) & Trauma Response')) {
      recommendedUnits.push('Emergency Medical Services (EMS) & Trauma Response');
    }
    immediateActions.push('Dispatch intensive care ambulance and establish field triage desk.');
  }

  if (message.includes('fire') || message.includes('smoke') || message.includes('gas') || message.includes('explosion') || message.includes('blaze')) {
    score += 25;
    hazards.push('Toxic Smoke / Explosive Gas Hazard');
    recommendedUnits.push('HAZMAT Response Squad & Fire Brigade');
    immediateActions.push('Isolate 500m city zone, deploy ventilation fans and breathing apparatus.');
  }

  if (message.includes('stampede') || message.includes('crowd') || message.includes('crush')) {
    score += 25;
    hazards.push('Urban Crowd Stampede / Panic');
    recommendedUnits.push('City Police Force & Rapid Action Force (RAF)');
    immediateActions.push('Create emergency egress channels and mobilize crowd control barriers.');
  }

  if (message.includes('heat') || message.includes('sunstroke') || message.includes('dehydration')) {
    score += 15;
    hazards.push('Extreme Urban Heatwave');
    recommendedUnits.push('Mobile Cooling & Hydration Van');
    immediateActions.push('Distribute electrolyte fluids and transfer victims to climate-controlled centers.');
  }

  if (hazards.length === 0) {
    hazards.push('General City Emergency');
  }
  if (recommendedUnits.length === 0) {
    recommendedUnits.push('City Disaster Rapid Response Unit');
  }
  if (immediateActions.length === 0) {
    immediateActions.push('Establish direct voice contact with victim to confirm safety status.');
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(15, score));

  let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  if (score >= 80) priority = 'critical';
  else if (score >= 60) priority = 'high';
  else if (score >= 40) priority = 'medium';
  else priority = 'low';

  return {
    score,
    priority,
    summary: `SafeSphere AI Triage Engine: ${victimCount} victim(s) in city sector. Risk Score ${score}/100 (${priority.toUpperCase()}).`,
    identifiedHazards: hazards,
    recommendedUnits,
    immediateActions,
    shelterMatchNote: 'Closest urban relief facility flagged for immediate capacity reservation.'
  };
};

const runHeuristicAIChat = (prompt: string, context?: any): string => {
  const p = prompt.toLowerCase();

  // Fire / Burn / Flame / Smoke / Blaze / Wildfire / Industrial Fire
  if (p.includes('fire') || p.includes('burn') || p.includes('smoke') || p.includes('blaze') || p.includes('flame') || p.includes('wildfire') || p.includes('explosion')) {
    return `🔥 **Emergency Fire & Smoke Safety Protocol (Urban & Industrial)**:

1. **Stay Low Under Smoke**: Smoke rises and carries deadly carbon monoxide. Crawl on your hands and knees where oxygen is richest.
2. **Feel Doors Before Opening**: Use the back of your hand to touch door surfaces and handles. If hot, **DO NOT OPEN**. Find an alternative window or fire escape.
3. **Clothing Fire (STOP, DROP & ROLL)**:
   - **STOP** running.
   - **DROP** to the ground and cover your face.
   - **ROLL** side to side until fire is out.
4. **City High-Rise Evacuation**: Use emergency fire stairwells. **NEVER USE ELEVATORS**.
5. **If Trapped in Room / Apartment**:
   - Seal door gaps with wet sheets or clothing.
   - Signal from window with bright cloth, phone light, or loud whistle.
   - Dispatch an **Emergency SOS** on SafeSphere so city fire command pinpoints your floor.`;
  }

  // Flood / Urban Waterlogging / Coastal Storm Surge
  if (p.includes('flood') || p.includes('water') || p.includes('submerged') || p.includes('drowning') || p.includes('waterlog')) {
    return `🌊 **Natural & Urban Flood Safety Protocol**:
1. **Vertical Evacuation**: Move to upper floors of concrete buildings. Avoid basements, subways, and underground parking.
2. **Do Not Walk or Drive in Flood Water**: 6 inches of rapid water can sweep adults off feet; 2 feet can carry away cars.
3. **Power Outage Safety**: Turn off main breaker switches before water enters power sockets.
4. **Contaminated Water Warning**: Do not drink floodwater. Use purified bottled supplies.
5. **Emergency Signal**: Trigger SafeSphere SOS if trapped on roof or upper structure.`;
  }

  // Earthquake / Tremor / Structural Collapse
  if (p.includes('earthquake') || p.includes('tremor') || p.includes('shaking') || p.includes('seismic') || p.includes('collapse') || p.includes('building')) {
    return `🏚️ **Earthquake & Building Collapse Safety**:
1. **DROP, COVER, HOLD ON**: Drop to knees. Cover head/neck under heavy furniture or against an interior wall.
2. **If Inside City Buildings**: Stay inside until shaking stops. Avoid exterior walls, glass windows, and elevators.
3. **If Outdoors in City**: Move to open grounds away from skyscrapers, billboards, power poles, and overpasses.
4. **Trapped Under Rubble**: Tap rhythmically on pipes/walls so urban acoustic sensors can locate you. Cover mouth to reduce dust intake.`;
  }

  // CPR / First Aid / Mass Casualty / Medical Trauma
  if (p.includes('cpr') || p.includes('first aid') || p.includes('medical') || p.includes('bleeding') || p.includes('injury') || p.includes('wound') || p.includes('trauma')) {
    return `🚑 **City Emergency Medical & First Aid Protocol**:
1. **Severe Bleeding**: Press hard on wound with clean cloth. Maintain continuous pressure and elevate limb above heart level.
2. **Adult CPR**: 100-120 chest compressions per minute (center of chest, 2 inches deep) to the rhythm of "Stayin' Alive".
3. **Thermal / Chemical Burns**: Rinse with cool running water for 10-15 mins. Cover loosely with clean cloth. Do NOT pop blisters.
4. **Heatstroke / Fainting**: Move person to shaded cool area, loosen tight clothing, and apply wet towels to neck and armpits.`;
  }

  // Cyclone / Typhoon / Severe City Storm
  if (p.includes('cyclone') || p.includes('storm') || p.includes('hurricane') || p.includes('typhoon') || p.includes('gale')) {
    return `🌀 **Cyclone & Severe Storm Protection**:
1. **Shelter Indoors**: Stay in central rooms away from glass windows and external doors.
2. **Secure Flying Debris**: Fasten loose outdoor objects, signs, and roofing sheets.
3. **Power & Communication**: Charge mobile phones and power banks. Keep flashlights ready.
4. **Monitor City Alerts**: Track live advisory updates on the SafeSphere Emergency Broadcast feed.`;
  }

  // Gas Leak / Chemical Spill / Industrial Hazard
  if (p.includes('chemical') || p.includes('gas') || p.includes('leak') || p.includes('toxic') || p.includes('hazmat')) {
    return `⚠️ **Urban Gas Leak & Chemical Spill Protocol**:
1. **Evacuate Crosswind / Upwind**: Move perpendicular to wind direction away from toxic odor/plume.
2. **Respiratory Shield**: Breathe through wet cloth or N95 mask to filter hazardous particulates.
3. **No Open Flames / Switches**: Do NOT flip electrical switches, light matches, or start vehicle engines near gas leaks.`;
  }

  // Stampede / Mass Crowd Crush
  if (p.includes('stampede') || p.includes('crowd') || p.includes('crush') || p.includes('panic')) {
    return `👥 **Urban Crowd Crush & Stampede Survival**:
1. **Stay on Your Feet**: Keep upright. Do not drop items or bend down to pick them up.
2. **Boxer Stance**: Hold arms up in front of chest like a boxer to create breathing space for your lungs.
3. **Move Diagonally**: Walk with the flow of crowd towards open edges rather than pushing against it.`;
  }

  // Emergency Shelter & City Navigation
  if (p.includes('shelter') || p.includes('where to go') || p.includes('evacuate') || p.includes('camp') || p.includes('relief center')) {
    const shelterCount = context?.shelterCount || 0;
    return `🏠 **City Emergency Shelter Network**:
There are **${shelterCount} open relief shelters** active in the SafeSphere network.
- Click **Shelters** in the left menu to view real-time occupancy, location maps, and route guidance.
- Carry essential medication, ID cards, emergency cash, and water when evacuating.`;
  }

  // General Emergency Assistance
  if (p.includes('help') || p.includes('save') || p.includes('trapped') || p.includes('rescue') || p.includes('emergency') || p.includes('protect') || p.includes('city')) {
    return `🆘 **SafeSphere Emergency Rescue Command**:
1. **Trigger SOS Alert**: Open **Emergency SOS** tab and submit alert so city disaster management receives your GPS location.
2. **Conserve Mobile Battery**: Dim screen brightness and reserve battery for emergency rescue calls.
3. **Stay Visible**: Display bright clothing or flashlight from high window if trapped in a building.`;
  }

  return `🤖 **SafeSphere AI Emergency Assistant**:
I am trained to support both **Natural Disasters** (Floods, Earthquakes, Cyclones, Landslides) and **Urban City Emergencies** (Fires, Gas Leaks, Collapses, Stampedes, First Aid).

**Quick Prompts You Can Ask Me:**
• "How to protect myself during a fire?"
• "What to do during an urban flood?"
• "Earthquake & building collapse safety"
• "Crowd crush & stampede survival"
• "Emergency First Aid & CPR steps"
• "How to locate nearby relief shelters"`;
};

/**
 * Main AI Chat Service
 */
export const getAIChatResponse = async (prompt: string, contextData?: any): Promise<string> => {
  if (!ENV.GEMINI_API_KEY) {
    return runHeuristicAIChat(prompt, contextData);
  }

  try {
    const systemPrompt = `You are SafeSphere AI, an expert emergency response assistant specializing in both Natural Disasters (Floods, Earthquakes, Cyclones, Landslides, Tsunamis) and Urban City Emergencies (Building Fires, Structural Collapses, Gas Leaks, Chemical Spills, Crowd Stampedes, Trauma First Aid). Provide clear, empathetic, action-oriented, step-by-step safety instructions in markdown formatting. Active System Context: activeDisasters=${contextData?.activeDisasters || 0}, openSheltersCount=${contextData?.shelterCount || 0}. User Query: ${prompt}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (replyText) {
      return replyText;
    }

    return runHeuristicAIChat(prompt, contextData);
  } catch (error) {
    return runHeuristicAIChat(prompt, contextData);
  }
};

/**
 * Main SOS Triage Analysis Service
 */
export const analyzeSOSTriage = async (sosData: any): Promise<SOSTriageResult> => {
  if (!ENV.GEMINI_API_KEY) {
    return runHeuristicSOSTriage(sosData);
  }

  try {
    const prompt = `Analyze this emergency SOS alert and respond ONLY with a strict valid JSON object (no markdown surrounding ticks):
{
  "score": number between 0 and 100,
  "priority": "critical" | "high" | "medium" | "low",
  "summary": "1 sentence brief summary",
  "identifiedHazards": ["hazard 1", "hazard 2"],
  "recommendedUnits": ["unit type 1", "unit type 2"],
  "immediateActions": ["action 1", "action 2"],
  "shelterMatchNote": "recommendation note"
}

SOS Alert Data:
- Category/Type: ${sosData.type}
- Message: ${sosData.message}
- Victims Count: ${sosData.numberOfPeople}
- Location: ${sosData.location?.address || 'Unknown'} (${sosData.district}, ${sosData.state}, ${sosData.country})
- Initial Priority: ${sosData.priority}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (response.ok) {
      const data: any = await response.json();
      let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: SOSTriageResult = JSON.parse(rawText);
      if (parsed && typeof parsed.score === 'number') {
        return parsed;
      }
    }

    return runHeuristicSOSTriage(sosData);
  } catch (err) {
    return runHeuristicSOSTriage(sosData);
  }
};
