import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Disaster from '../models/Disaster';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/disasterconnect';

const disastersData = [
  {
    title: 'Mumbai Coastal Urban Flood',
    type: 'flood',
    severity: 'critical',
    status: 'active',
    description: 'Relentless monsoon downpours led to severe urban flooding across Dharavi, Kurla, and Sion. Local transport disrupted and emergency water rescue deployed.',
    location: {
      lat: 19.0760,
      lng: 72.8777,
      address: 'Kurla West, Mumbai, Maharashtra 400070',
      radius: 15,
    },
    affectedArea: 'Greater Mumbai Municipal Region',
    affectedCount: 12500,
    startDate: new Date('2026-08-01T08:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Himalayan Flash Flood & Cloudburst',
    type: 'flood',
    severity: 'critical',
    status: 'active',
    description: 'Sudden cloudburst over Uttarkashi causing rapid surge in Bhagirathi river levels, damaging bridges and stranding pilgrimage groups.',
    location: {
      lat: 30.7268,
      lng: 78.4354,
      address: 'Uttarkashi Valley, Uttarakhand 249193',
      radius: 25,
    },
    affectedArea: 'Uttarkashi & Gangotri Valley',
    affectedCount: 4200,
    startDate: new Date('2026-08-05T04:30:00Z'),
    images: [
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Cyclone Biparjoy Coastal Surge',
    type: 'cyclone',
    severity: 'high',
    status: 'active',
    description: 'Category 3 severe cyclonic storm making landfall with wind speeds up to 145 km/h. Coastal evacuations in progress.',
    location: {
      lat: 23.2420,
      lng: 69.6669,
      address: 'Kutch Coast, Mandvi, Gujarat 370465',
      radius: 50,
    },
    affectedArea: 'Kutch & Saurashtra Coastline',
    affectedCount: 45000,
    startDate: new Date('2026-08-03T12:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Eastern Ghats Forest Wildfire',
    type: 'fire',
    severity: 'high',
    status: 'active',
    description: 'Uncontrolled forest fire spreading through dry deciduous vegetation in Araku biosphere reserve, threatening tribal hamlets.',
    location: {
      lat: 18.3273,
      lng: 82.8775,
      address: 'Araku Valley Biosphere, Andhra Pradesh 531149',
      radius: 12,
    },
    affectedArea: 'Araku Hill Range',
    affectedCount: 850,
    startDate: new Date('2026-08-08T14:15:00Z'),
    images: [
      'https://images.unsplash.com/photo-1599818816822-4828114f77c3?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Assam Brahmaputra Inundation',
    type: 'flood',
    severity: 'critical',
    status: 'active',
    description: 'Brahmaputra river submerged over 80% of Kaziranga Wildlife Sanctuary and surrounding 18 districts, affecting rural agriculture.',
    location: {
      lat: 26.9500,
      lng: 94.1667,
      address: 'Majuli River Island, Assam 785104',
      radius: 40,
    },
    affectedArea: 'Majuli & Kaziranga Basin',
    affectedCount: 28000,
    startDate: new Date('2026-07-28T06:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Wayanad Hillside Landslide Collapse',
    type: 'landslide',
    severity: 'high',
    status: 'active',
    description: 'Heavy precipitation triggered massive mudslides across tea estates in Meppadi, blocking state highways and damaging residential structures.',
    location: {
      lat: 11.5540,
      lng: 76.1264,
      address: 'Meppadi Village, Wayanad, Kerala 673577',
      radius: 8,
    },
    affectedArea: 'South Wayanad Western Ghats',
    affectedCount: 1400,
    startDate: new Date('2026-08-06T02:10:00Z'),
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Delhi Yamuna River Bank Overflow',
    type: 'flood',
    severity: 'medium',
    status: 'active',
    description: 'Hathnikund barrage water release pushed Yamuna water level above danger mark of 208.5 meters, inundating low-lying ring road stretches.',
    location: {
      lat: 28.6289,
      lng: 77.2483,
      address: 'ITO Yamuna Floodplain, New Delhi 110002',
      radius: 10,
    },
    affectedArea: 'Central & East Delhi Yamuna Bank',
    affectedCount: 8900,
    startDate: new Date('2026-08-07T10:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Marathwada Agricultural Severe Drought',
    type: 'drought',
    severity: 'high',
    status: 'monitoring',
    description: 'Extended dry spell resulting in 65% monsoon deficit across Latur and Beed districts. Tanker water distribution operational.',
    location: {
      lat: 18.4088,
      lng: 76.5604,
      address: 'Latur Rural District, Maharashtra 413512',
      radius: 60,
    },
    affectedArea: 'Marathwada Agricultural Zone',
    affectedCount: 75000,
    startDate: new Date('2026-06-15T00:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Gulmarg High-Altitude Avalanche',
    type: 'other',
    severity: 'high',
    status: 'active',
    description: 'Unseasonable heavy snowfall caused a severe snow avalanche along the Apharwat Peak ridge. Search and rescue operations initiated.',
    location: {
      lat: 34.0484,
      lng: 74.3805,
      address: 'Apharwat Ridge, Gulmarg, Jammu & Kashmir 193403',
      radius: 5,
    },
    affectedArea: 'Gulmarg Upper Slopes',
    affectedCount: 620,
    startDate: new Date('2026-08-09T11:40:00Z'),
    images: [
      'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Ankleshwar GIDC Industrial Chemical Fire',
    type: 'fire',
    severity: 'critical',
    status: 'active',
    description: 'Solvent tank leak triggered massive chemical blaze in industrial manufacturing unit. Hazardous smoke plume evacuation enforced.',
    location: {
      lat: 21.6264,
      lng: 73.0152,
      address: 'GIDC Industrial Estate, Ankleshwar, Gujarat 393002',
      radius: 6,
    },
    affectedArea: 'Ankleshwar Industrial Zone',
    affectedCount: 350,
    startDate: new Date('2026-08-10T16:20:00Z'),
    images: [
      'https://images.unsplash.com/photo-1599818816822-4828114f77c3?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Sundarbans Super Cyclone Surge Recovery',
    type: 'cyclone',
    severity: 'high',
    status: 'monitoring',
    description: 'Post-cyclone sea water intrusion corrupted freshwater ponds and damaged embankment levees in coastal delta villages.',
    location: {
      lat: 21.9497,
      lng: 88.9007,
      address: 'Gospa Island, Sundarbans, West Bengal 743370',
      radius: 45,
    },
    affectedArea: 'Sundarbans Coastal Delta',
    affectedCount: 120000,
    startDate: new Date('2026-07-20T00:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'North Bihar Kosi River Embankment Breach',
    type: 'flood',
    severity: 'medium',
    status: 'active',
    description: 'Kosi river breach flooded agricultural lowlands across Supaul and Saharsa. Community shelters setup in high-ground schools.',
    location: {
      lat: 26.1260,
      lng: 86.6022,
      address: 'Supaul Sector 4, Bihar 852131',
      radius: 20,
    },
    affectedArea: 'Kosi River Embankment Zone',
    affectedCount: 19500,
    startDate: new Date('2026-08-04T09:15:00Z'),
    images: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Shimla Summer Hill Slope Instability',
    type: 'landslide',
    severity: 'medium',
    status: 'monitoring',
    description: 'Soil erosion and heavy rainfall resulted in minor rockfalls and structural cracks along the Shimla-Kalka railway corridor.',
    location: {
      lat: 31.1048,
      lng: 77.1734,
      address: 'Summer Hill, Shimla, Himachal Pradesh 171005',
      radius: 4,
    },
    affectedArea: 'Summer Hill Ridge Corridor',
    affectedCount: 450,
    startDate: new Date('2026-08-02T15:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Nagapattinam Coastal Deep-Sea Tremor Watch',
    type: 'tsunami',
    severity: 'low',
    status: 'resolved',
    description: 'Sub-sea 6.2 magnitude earthquake near Indian Ocean triggered precautionary tsunami alert along Tamil Nadu coast. Advisory withdrawn.',
    location: {
      lat: 10.7673,
      lng: 79.8449,
      address: 'Nagapattinam Port, Tamil Nadu 611001',
      radius: 30,
    },
    affectedArea: 'Coromandel Coastline',
    affectedCount: 5000,
    startDate: new Date('2026-07-15T03:00:00Z'),
    endDate: new Date('2026-07-16T18:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    title: 'Solapur Hailstorm & Agricultural Damage',
    type: 'other',
    severity: 'low',
    status: 'resolved',
    description: 'Severe unseasonal hailstorm destroyed pomegranate and grape orchards across 45 villages. Damage assessment completed.',
    location: {
      lat: 17.6599,
      lng: 75.9064,
      address: 'Solapur Rural District, Maharashtra 413001',
      radius: 25,
    },
    affectedArea: 'Solapur Grape Farming Belt',
    affectedCount: 3200,
    startDate: new Date('2026-07-10T17:00:00Z'),
    endDate: new Date('2026-07-12T12:00:00Z'),
    images: [
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

async function seedDisasters() {
  try {
    await mongoose.connect(MONGO_URI);
    await Disaster.deleteMany({});

    const created = await Disaster.insertMany(disastersData);

    created.forEach((d, i) => {});

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

seedDisasters();
