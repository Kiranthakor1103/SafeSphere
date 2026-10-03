/**
 * Migration: Backfill districtCode for all existing documents
 * Run: ts-node src/seed/migrateDistrictCodes.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateDistrictCode } from '../utils/districtHelper';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/disasterconnect';

async function extractDistrict(doc: any): Promise<string> {
  return (
    doc.district ||
    doc.targetDistrict ||
    doc.assignedDistrict ||
    doc.location?.address?.split(',')[0]?.trim() ||
    doc.lastSeenLocation?.address?.split(',')[0]?.trim() ||
    doc.affectedArea?.split(',')[0]?.trim() ||
    ''
  );
}

async function migrateCollection(db: mongoose.Connection, collectionName: string) {
  const collection = db.collection(collectionName);
  const docs = await collection.find({ $or: [{ districtCode: { $exists: false } }, { districtCode: '' }] }).toArray();

  let updated = 0;

  for (const doc of docs) {
    const distName = await extractDistrict(doc);
    if (!distName || distName.toLowerCase().startsWith('select')) continue;

    const country = doc.country || 'India';
    const state = doc.state || 'Gujarat';
    const code = generateDistrictCode(country, state, distName);

    if (code) {
      await collection.updateOne({ _id: doc._id }, { $set: { districtCode: code } });
      updated++;
    }
  }
}

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection;

  const collections = ['users', 'disasters', 'sosalerts', 'shelters', 'rescueteams', 'volunteers', 'resources', 'missingpersons', 'alerts'];
  for (const col of collections) {
    try {
      await migrateCollection(db, col);
    } catch (err: any) {}
  }

  process.exit(0);
}

run().catch(err => {
  process.exit(1);
});
