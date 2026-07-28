import { Document, Schema, model } from 'mongoose';

/** Allowed vehicle values — keep TS and the Mongoose enum in sync. */
export type VehicleType = 'bike' | 'car' | 'bicycle';

/**
 * DeliveryPartner — rider / driver who fulfills orders.
 * Same auth fields as Customer, plus availability and live location.
 */
export interface IDeliveryPartner extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: VehicleType;
  /** Whether they are currently accepting new orders. */
  isAvailable: boolean;
  /** Live coords for tracking; defaults keep the shape present even before GPS updates. */
  currentLocation: {
    lat: number;
    lng: number;
  };
}

const DeliveryPartnerSchema = new Schema<IDeliveryPartner>(
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
    // enum: rejects anything outside this list at the DB layer
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'bicycle'] satisfies VehicleType[],
      required: true,
    },
    // default false — partners opt in when they go online
    isAvailable: { type: Boolean, default: false },
    // nested subdoc (not a separate collection) for lat/lng updates
    currentLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
  },
  { timestamps: true } // createdAt / updatedAt managed by Mongoose
);

export const DeliveryPartner = model<IDeliveryPartner>(
  'DeliveryPartner',
  DeliveryPartnerSchema
);
