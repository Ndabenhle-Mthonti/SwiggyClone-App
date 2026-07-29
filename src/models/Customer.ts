import bcrypt from 'bcrypt';
import { Document, Schema, model } from 'mongoose';

/**
 * DESIGN NOTES (Customer)
 * -----------------------
 * - password uses select: false so list/get queries never leak hashes by accident.
 * - pre('save') hashes only when password changed (isModified) — see hook comment.
 * - comparePassword is an instance method so controllers stay free of bcrypt details.
 */

export interface ICustomer extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  addresses: {
    label: string;
    line1: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false — omitted unless you explicitly .select('+password')
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    addresses: [
      {
        label: { type: String, default: 'Home' },
        line1: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

/**
 * Hash on create / password change only.
 * isModified('password') matters: without it, every save (e.g. updating phone)
 * would bcrypt.hash() the *already hashed* string again — then login breaks
 * because comparePassword checks the plain password against a double-hash.
 */
CustomerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

CustomerSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  // constant-time compare vs stored hash (never store or log the candidate)
  return bcrypt.compare(candidate, this.password);
};

export const Customer = model<ICustomer>('Customer', CustomerSchema);
