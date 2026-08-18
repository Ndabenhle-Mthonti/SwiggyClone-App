import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RestaurantList } from './pages/RestaurantList';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { OrderTracking } from './pages/OrderTracking';
import { CreateRestaurant } from './pages/CreateRestaurant';
import { ManageMenu } from './pages/ManageMenu';
import { IncomingOrders } from './pages/IncomingOrders';
import './App.css';

/**
 * DESIGN NOTES (App)
 * ------------------
 * CartProvider wraps routes so restaurant detail + checkout share one cart.
 * Customer-only paths use allowedRoles={['customer']} — UI gate only; the API
 * still enforces authorize('customer') on POST /orders.
 */
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurants"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <RestaurantList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurants/:id"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <RestaurantDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <OrderTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/create-restaurant"
              element={
                <ProtectedRoute allowedRoles={['restaurant_admin']}>
                  <CreateRestaurant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/restaurant"
              element={
                <ProtectedRoute allowedRoles={['restaurant_admin']}>
                  <ManageMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={['restaurant_admin']}>
                  <IncomingOrders />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
