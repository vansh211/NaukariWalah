import { JobModel } from '../models/Job';
import { UserModel } from '../models/User';
import { ResumeModel } from '../models/Resume';
import { db } from './store';

export async function syncDataToMongo() {
  try {
    // 1. Sync Jobs
    const jobCount = await JobModel.countDocuments();
    if (jobCount < 100) {
      console.log('🔄 Seeding 205+ jobs into MongoDB database (job_recruiter_db.jobs)...');
      await JobModel.deleteMany({});
      await JobModel.insertMany(db.jobs);
      console.log('✅ 205 Jobs successfully inserted into MongoDB!');
    }

    // 2. Sync Users
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('🔄 Seeding users into MongoDB database (job_recruiter_db.users)...');
      await UserModel.insertMany(db.users);
      console.log('✅ Users successfully inserted into MongoDB!');
    }

    // 3. Sync Resumes
    const resumeCount = await ResumeModel.countDocuments();
    if (resumeCount === 0 && db.resumes.length > 0) {
      console.log('🔄 Seeding resumes into MongoDB database (job_recruiter_db.resumes)...');
      await ResumeModel.insertMany(db.resumes);
      console.log('✅ Resumes successfully inserted into MongoDB!');
    }
  } catch (err) {
    console.warn('⚠️ Could not sync data to MongoDB:', err);
  }
}
