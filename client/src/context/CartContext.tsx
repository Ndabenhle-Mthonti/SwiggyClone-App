import { createContext, useContext, useState, type ReactNode } from 'react';

export interface CartItem {
  menuItemId: string;
  itemName: string;
  price: number;
  quantity: number;
}

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
}

interface CartContextValue extends CartState {
  /**
   * @returns true if the item was added; false if blocked (different restaurant).
   */
  addItem: (restaurantId: string, item: Omit<CartItem, 'quantity'>) => boolean;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * DESIGN NOTES (CartContext)
 * --------------------------
 * Single-restaurant cart: food delivery checkouts map to one kitchen/order.
 * Mixing restaurants would break POST /orders (one restaurantId) and confuse
 * totals. We *reject* cross-restaurant adds rather than auto-clearing — wiping
 * someone's cart mid-browse is surprising; better to show a message and let
 * them clearCart() deliberately when ready to switch.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(
    nextRestaurantId: string,
    item: Omit<CartItem, 'quantity'>
  ): boolean {
    if (restaurantId && restaurantId !== nextRestaurantId && items.length > 0) {
      return false;
    }

    setRestaurantId(nextRestaurantId);
    setItems((current) => {
      const existing = current.find((row) => row.menuItemId === item.menuItemId);
      if (existing) {
        return current.map((row) =>
          row.menuItemId === item.menuItemId
            ? { ...row, quantity: row.quantity + 1 }
            : row
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
    return true;
  }

  function removeItem(menuItemId: string) {
    setItems((current) => {
      const next = current.filter((row) => row.menuItemId !== menuItemId);
      if (next.length === 0) {
        setRestaurantId(null);
      }
      return next;
    });
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    if (quantity < 1) {
      removeItem(menuItemId);
      return;
    }

    setItems((current) =>
      current.map((row) =>
        row.menuItemId === menuItemId ? { ...row, quantity } : row
      )
    );
  }

  function clearCart() {
    setRestaurantId(null);
    setItems([]);
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        restaurantId,
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
