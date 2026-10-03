import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { IUser } from '../models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/disasterconnect';

const defaultPassword = 'Safe@3333';

const usersToSeed: Array<Partial<IUser>> = [
  {
    name: 'Citizen User',
    email: 'citizen@safesphere.org',
    password: defaultPassword,
    role: 'citizen',
    phone: '9876543210',
    district: 'Mumbai',
    location: { lat: 19.0760, lng: 72.8777, address: 'Mumbai, Maharashtra' },
    isActive: true,
  },
  {
    name: 'Field Volunteer',
    email: 'volunteer@safesphere.org',
    password: defaultPassword,
    role: 'volunteer',
    phone: '9876543211',
    district: 'Uttarkashi',
    location: { lat: 30.7268, lng: 78.4354, address: 'Uttarkashi, Uttarakhand' },
    isActive: true,
  },
  {
    name: 'Rescue Team Commander',
    email: 'rescueteam@safesphere.org',
    password: defaultPassword,
    role: 'rescue_team',
    phone: '9876543212',
    district: 'Kutch',
    location: { lat: 23.2420, lng: 69.6669, address: 'Kutch, Gujarat' },
    isActive: true,
  },
  {
    name: 'Shelter Facility Manager',
    email: 'sheltermanager@safesphere.org',
    password: defaultPassword,
    role: 'shelter_manager',
    phone: '9876543213',
    district: 'Wayanad',
    location: { lat: 11.5540, lng: 76.1264, address: 'Wayanad, Kerala' },
    isActive: true,
  },
  {
    name: 'District Regional Admin',
    email: 'districtadmin@safesphere.org',
    password: defaultPassword,
    role: 'district_admin',
    phone: '9876543214',
    country: 'India',
    state: 'Delhi',
    district: 'New Delhi',
    location: { lat: 28.6289, lng: 77.2483, address: 'New Delhi, Delhi' },
    isActive: true,
  },
  {
    name: 'Super System Administrator',
    email: 'superadmin@safesphere.org',
    password: defaultPassword,
    role: 'super_admin',
    phone: '9876543215',
    district: 'Central HQ',
    location: { lat: 28.6139, lng: 77.2090, address: 'Central HQ, New Delhi' },
    isActive: true,
  },
  {
    name: 'NGO Relief Coordinator',
    email: 'ngo@safesphere.org',
    password: defaultPassword,
    role: 'ngo',
    phone: '9876543216',
    district: 'Assam',
    location: { lat: 26.9500, lng: 94.1667, address: 'Majuli, Assam' },
    isActive: true,
  },
  {
    name: 'System Operations Admin',
    email: 'admin@safesphere.org',
    password: defaultPassword,
    role: 'admin',
    phone: '9876543217',
    district: 'HQ Operations',
    location: { lat: 19.0760, lng: 72.8777, address: 'Operations HQ, Mumbai' },
    isActive: true,
  },
];

async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    const deleteResult = await User.deleteMany({});
    const createdUsers = [];

    for (const userData of usersToSeed) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

seedUsers();
