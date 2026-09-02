import mongoose, { Schema, Document } from 'mongoose';

export interface IJobDocument extends Document {
  id: string;
  recruiterId: string;
  recruiterName: string;
  company: string;
  companyLogo?: string;
  companyColor?: string;
  title: string;
  description: string;
  location: string;
  type: string;
  experienceRequired: string;
  minExperience: number;
  salaryRange: string;
  skills: string[];
  perks: string[];
  postedAt: string;
  applicantsCount?: number;
  rating?: number;
  reviewCount?: number;
}

const JobSchema = new Schema<IJobDocument>({
  id: { type: String, required: true, unique: true },
  recruiterId: { type: String, required: true },
  recruiterName: { type: String, required: true },
  company: { type: String, required: true },
  companyLogo: { type: String },
  companyColor: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, default: 'Full-time' },
  experienceRequired: { type: String, required: true },
  minExperience: { type: Number, default: 0 },
  salaryRange: { type: String, required: true },
  skills: [{ type: String }],
  perks: [{ type: String }],
  postedAt: { type: String, default: () => new Date().toISOString() },
  applicantsCount: { type: Number, default: 0 },
  rating: { type: Number, default: 4.2 },
  reviewCount: { type: Number, default: 450 },
});

export const JobModel = mongoose.model<IJobDocument>('Job', JobSchema);
