import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Disaster from '../models/Disaster';
import SOSAlert from '../models/SOSAlert';
import Shelter from '../models/Shelter';
import RescueTeam from '../models/RescueTeam';
import Resource from '../models/Resource';
import MissingPerson from '../models/MissingPerson';
import Alert from '../models/Alert';
import Volunteer from '../models/Volunteer';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/disasterconnect';

const seedScenario = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    // Fetch existing seeded users
    const superAdmin = await User.findOne({ email: 'super_admin@safesphere.org' });
    const districtAdmin = await User.findOne({ email: 'district_admin@safesphere.org' });
    const shelterManager = await User.findOne({ email: 'shelter_manager@safesphere.org' });
    const rescueLeader = await User.findOne({ email: 'rescue_team@safesphere.org' });
    const volunteerUser = await User.findOne({ email: 'volunteer@safesphere.org' });
    const citizenUser = await User.findOne({ email: 'citizen@safesphere.org' });

    const adminId = superAdmin?._id || districtAdmin?._id;
    const citizenId = citizenUser?._id || adminId;
    const managerId = shelterManager?._id || adminId;
    const leaderId = rescueLeader?._id || adminId;
    const volUserId = volunteerUser?._id || adminId;

    // 1. DISASTER RECORD
    const disasterData = {
      title: 'Sabarmati River Flash Flood',
      type: 'flood' as const,
      severity: 'critical' as const,
      status: 'active' as const,
      description: 'Severe cloudburst triggered rapid flash flooding along Sabarmati Riverfront. Emergency evacuation in progress.',
      location: {
        lat: 23.090629,
        lng: 72.597571,
        address: 'Sabarmati Riverfront, Motera Exit Road, Ahmedabad, Gujarat 380005',
        radius: 15,
      },
      affectedArea: 'Sabarmati & Motera Municipal Region, Ahmedabad',
      affectedCount: 500,
      startDate: new Date(),
      images: [
        'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
      ],
    };

    // Upsert Disaster
    let disaster = await Disaster.findOne({ title: disasterData.title });
    if (!disaster) {
      disaster = await Disaster.create(disasterData);
    } else {}

    // 2. RESCUE TEAM
    let rescueTeam = await RescueTeam.findOne({ name: 'Ahmedabad NDRF Rapid Unit 1' });
    if (!rescueTeam) {
      rescueTeam = await RescueTeam.create({
        name: 'Ahmedabad NDRF Rapid Unit 1',
        specialization: ['search_rescue', 'flood_evacuation', 'first_aid'],
        status: 'available',
        leader: leaderId,
        members: leaderId ? [leaderId] : [],
        location: {
          lat: 23.0915,
          lng: 72.5970,
          address: 'Motera Rescue Base, Ahmedabad, Gujarat',
        },
        equipment: ['Motorboats', 'Life Vests', 'Thermal Imagers', 'First Aid Kits'],
        contactPhone: '9898989898',
        countryCode: '+91',
        vehicleType: 'Boat',
        capacity: 20,
        assignedDisaster: disaster._id,
      });
    } else {}

    // 3. SOS ALERT
    let sos = await SOSAlert.findOne({ message: /Trapped on rooftop with family/i });
    if (!sos && citizenId) {
      sos = await SOSAlert.create({
        userId: citizenId,
        disasterId: disaster._id,
        type: 'flood',
        priority: 'critical',
        status: 'pending',
        message: 'Trapped on rooftop with family of 4. Water level rising fast near Motera Exit Road!',
        location: {
          lat: 23.090629,
          lng: 72.597571,
          address: 'Narendra Modi Stadium Exit Road, Sabarmati, Ahmedabad, Gujarat 380005',
        },
        contactPhone: '8945127845',
        countryCode: '+91',
        numberOfPeople: 4,
      });
    } else {}

    // 4. SHELTER
    let shelter = await Shelter.findOne({ name: 'Motera Community Relief Center' });
    if (!shelter) {
      shelter = await Shelter.create({
        name: 'Motera Community Relief Center',
        type: 'stadium',
        status: 'open',
        location: {
          lat: 23.0910,
          lng: 72.5980,
          address: 'Motera Stadium Complex, Ahmedabad, Gujarat 380005',
        },
        capacity: 300,
        currentOccupancy: 120,
        facilities: {
          foodAvailable: true,
          drinkingWater: true,
          medicalSupport: true,
          electricity: true,
          washrooms: true,
          wifi: true,
          womenArea: true,
          childrenArea: true,
          wheelchairAccess: true,
        },
        contactPerson: 'Suresh Patel',
        contactPhone: '9876543210',
        countryCode: '+91',
        disasterId: disaster._id,
        managedBy: managerId,
        supplies: { food: true, water: true, medicine: true, bedding: true },
        notes: 'Equipped with medical triage center and emergency kitchen.',
      });
    } else {}

    // 5. RESOURCES
    const waterRes = await Resource.findOne({ name: 'Emergency Drinking Water Kits' });
    if (!waterRes) {
      await Resource.create({
        name: 'Emergency Drinking Water Kits',
        type: 'water',
        quantity: 500,
        unit: 'Liters',
        status: 'available',
        location: shelter.location,
        assignedTo: shelter._id,
        disasterId: disaster._id,
        providedBy: 'Gujarat Disaster Relief Fund',
      });
    }

    const foodRes = await Resource.findOne({ name: 'Packaged Meal Boxes' });
    if (!foodRes) {
      await Resource.create({
        name: 'Packaged Meal Boxes',
        type: 'food',
        quantity: 300,
        unit: 'Units',
        status: 'available',
        location: shelter.location,
        assignedTo: shelter._id,
        disasterId: disaster._id,
        providedBy: 'Akshaya Patra Foundation',
      });
    }

    // 6. MISSING PERSON
    let missingPerson = await MissingPerson.findOne({ name: 'Rohan Verma' });
    if (!missingPerson) {
      missingPerson = await MissingPerson.create({
        name: 'Rohan Verma',
        age: 10,
        gender: 'male',
        photo: '',
        description: 'Separated during flash flood evacuation.',
        lastSeenLocation: {
          lat: 23.090629,
          lng: 72.597571,
          address: 'Motera Exit Road, Sabarmati, Ahmedabad, Gujarat',
        },
        status: 'missing',
        reportedBy: citizenId,
        disasterId: disaster._id,
        contactPerson: 'Rakesh Verma',
        contactPhone: '9845127845',
        countryCode: '+91',
        distinguishingFeatures: 'Wearing blue jacket, red backpack',
      });
    } else {}

    // 7. BROADCAST ALERT
    let broadcastAlert = await Alert.findOne({ title: /EVACUATION WARNING/i });
    if (!broadcastAlert) {
      broadcastAlert = await Alert.create({
        title: '🚨 EVACUATION WARNING - Sabarmati Riverfront',
        message: 'Severe flood waters rising along Sabarmati Riverfront. All residents move to Motera Relief Center immediately.',
        type: 'evacuation',
        targetRoles: ['super_admin', 'district_admin', 'shelter_manager', 'rescue_team', 'volunteer', 'citizen'],
        disasterId: disaster._id,
        issuedBy: adminId,
        isActive: true,
        area: { lat: 23.090629, lng: 72.597571, radius: 15 },
      });
    }

    // 8. VOLUNTEER RECORD
    if (volUserId) {
      let volunteer = await Volunteer.findOne({ userId: volUserId });
      if (!volunteer) {
        await Volunteer.create({
          userId: volUserId,
          skills: ['search_rescue', 'first_aid', 'driving'],
          isAvailable: true,
          experience: '5 years active volunteer experience in Gujarat disaster response teams.',
          hoursContributed: 42,
          assignedDisaster: disaster._id,
          assignedTeam: rescueTeam._id,
        });
      }
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedScenario();
