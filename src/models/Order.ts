import { Document, Schema, Types, model } from 'mongoose';

/**
 * DESIGN NOTES (Order)
 * --------------------
 * - An Order is a *snapshot in time*: who ordered, from where, what line items,
 *   money total, and where it sits in the delivery pipeline.
 * - customerId / restaurantId are required refs. deliveryPartnerId is optional —
 *   null until a rider is assigned (common in food delivery: place → assign later).
 * - items store { menuItemId, quantity }, not full dish copies. menuItemId should
 *   match a Restaurant.menu subdoc _id. We keep the order lean; price at checkout
 *   is reflected in totalAmount (recompute carefully if menus change later).
 * - status is a string enum with default 'placed' so new orders always start in
 *   a known state. Enforce allowed transitions in service/controller code — the
 *   schema only constrains *valid values*, not *valid next steps*.
 */

/** Allowed order lifecycle values — keep TS and the Mongoose enum in sync. */
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

/** One line on the order — points at a menu subdoc + how many. */
export interface IOrderItem {
  menuItemId: Types.ObjectId;
  quantity: number;
}

export interface IOrder extends Document {
  customerId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  /** Set when a rider is assigned; null/undefined until then. */
  deliveryPartnerId?: Types.ObjectId | null;
  items: IOrderItem[];
  status: OrderStatus;
  totalAmount: number;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    // points at Restaurant.menu._id (subdoc), not a separate MenuItem collection
    menuItemId: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false } // line rows don't need their own ids — menuItemId + qty is enough
);

const OrderSchema = new Schema<IOrder>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    // not required — unassigned orders are normal early in the flow
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      default: null,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => Array.isArray(items) && items.length > 0,
        message: 'Order must include at least one item',
      },
    },
    // enum: DB rejects unknown statuses; default covers brand-new orders
    status: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'preparing',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ] satisfies OrderStatus[],
      default: 'placed',
    },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', OrderSchema);
