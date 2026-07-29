import { Document, Schema, Types, model } from 'mongoose';

/**
 * DESIGN NOTES (Restaurant)
 * -------------------------
 * - Menu lives as a *subdocument array* on Restaurant (not its own collection).
 *   That keeps "what this place sells" with the restaurant doc — simple reads for
 *   listing a menu. Trade-off: you don't query "all paneer dishes across the city"
 *   as easily as with a separate MenuItem collection.
 * - Each menu item gets its own _id (default for subdocs). Orders can store that
 *   as menuItemId so line items point at a specific dish without duplicating the
 *   whole menu row.
 * - ownerId refs RestaurantAdmin — the admin who manages this place. We store the
 *   ObjectId and populate when we need admin details.
 * - isOpen is operational state ("accepting orders right now"), separate from
 *   RestaurantAdmin.isApproved (platform gate before go-live).
 */

/** One dish on a restaurant's menu — embedded, not a top-level model. */
export interface IMenuItem {
  _id?: Types.ObjectId;
  itemName: string;
  price: number;
  isAvailable: boolean;
}

export interface IRestaurant extends Document {
  name: string;
  cuisineType: string;
  address: string;
  isOpen: boolean;
  /** Admin who owns / manages this restaurant. */
  ownerId: Types.ObjectId;
  menu: IMenuItem[];
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    itemName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    // default true — new dishes are sellable until the kitchen marks them out
    isAvailable: { type: Boolean, default: true },
  },
  // _id: true (default) — each menu row needs an id so Order.items can reference it
);

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true },
    cuisineType: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    // default false — open the doors explicitly once the kitchen is ready
    isOpen: { type: Boolean, default: false },
    // ref string must match the model name registered for RestaurantAdmin
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'RestaurantAdmin',
      required: true,
    },
    // subdocument array — stored inside this restaurant document
    menu: { type: [MenuItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Restaurant = model<IRestaurant>('Restaurant', RestaurantSchema);
