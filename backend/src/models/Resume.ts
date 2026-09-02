import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeDocument extends Document {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  skills: string[];
  experienceYears: number;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  uploadedAt: string;
}

const ResumeSchema = new Schema<IResumeDocument>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, default: 'Bengaluru / Remote' },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  skills: [{ type: String }],
  experienceYears: { type: Number, default: 2 },
  experience: [
    {
      company: { type: String },
      role: { type: String },
      duration: { type: String },
      description: { type: String },
    },
  ],
  education: [
    {
      institution: { type: String },
      degree: { type: String },
      year: { type: String },
    },
  ],
  uploadedAt: { type: String, default: () => new Date().toISOString() },
});

export const ResumeModel = mongoose.model<IResumeDocument>('Resume', ResumeSchema);
