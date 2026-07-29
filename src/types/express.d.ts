/**
 * DESIGN NOTES (Express Request augmentation)
 * -------------------------------------------
 * Declaration merging: TypeScript lets you reopen an existing interface and add
 * fields. @types/express already declares `namespace Express { interface Request }`.
 * By declaring that same path again in this file, our `user` property is merged
 * into Request everywhere — no casting `req as any` in middleware/controllers.
 *
 * `export {}` makes this file a module so `declare global` is required/allowed;
 * without it, top-level `declare namespace` could collide with script scope.
 */

export type AuthUser = {
  id: string;
  role: 'customer' | 'restaurant_admin' | 'delivery_partner';
};

declare global {
  namespace Express {
    interface Request {
      /** Set by authenticate middleware after a valid Bearer JWT. */
      user?: AuthUser;
    }
  }
}

export {};
