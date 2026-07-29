import bcrypt from 'bcrypt';
import { Document, Schema, Types, model } from 'mongoose';

/**
 * DESIGN NOTES (RestaurantAdmin)
 * ------------------------------
 * - Same auth surface as Customer (hash hook + comparePassword) so login can
 *   treat roles uniformly while still using role-specific models/collections.
 * - restaurantId / isApproved stay business fields; auth must not skip hashing
 *   when those unrelated fields change (hence isModified on password).
 */

export interface IRestaurantAdmin extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  /** ObjectId pointing at a Restaurant doc (the string 'Restaurant' matches that model's name). */
  restaurantId: Types.ObjectId;
  /** Must be true before this admin can take the restaurant live. */
  isApproved: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const RestaurantAdminSchema = new Schema<IRestaurantAdmin>(
  {
    name: { type: String, required: true, trim: true },
    // unique + lowercase + trim: one account per email, normalized for lookups
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false — password is omitted from queries unless you .select('+password')
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    // ref: 'Restaurant' is a string link for populate(); the Restaurant model can land later
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    // default false — ops must approve before go-live
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true } // createdAt / updatedAt managed by Mongoose
);

/**
 * Hash on create / password change only.
 * isModified('password') matters: without it, saving isApproved or restaurantId
 * would re-hash an already-hashed password and lock the user out of login.
 */
RestaurantAdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

RestaurantAdminSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const RestaurantAdmin = model<IRestaurantAdmin>(
  'RestaurantAdmin',
  RestaurantAdminSchema
);
