import { Document, Schema, Types, model } from 'mongoose';

/**
 * RestaurantAdmin — owns / manages a Restaurant.
 * Same auth fields as Customer, plus a restaurant link and approval gate.
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

export const RestaurantAdmin = model<IRestaurantAdmin>(
  'RestaurantAdmin',
  RestaurantAdminSchema
);
