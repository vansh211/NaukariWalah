import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'candidate' | 'recruiter';
  company?: string;
  title?: string;
  phone?: string;
  location?: string;
  createdAt: string;
}

const UserSchema = new Schema<IUserDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' },
  company: { type: String },
  title: { type: String },
  phone: { type: String },
  location: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
