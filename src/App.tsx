import { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PageLoader } from './components/PageLoader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
// HomePage se importa de forma estática: es la ruta de aterrizaje (LCP) y cargarla
// lazy añadiría una petición en cascada. Todas las demás rutas son chunks diferidos.
import HomePage from './pages/HomePage';
import {
  AccountPage,
  AdminPage,
  CartPage,
  LoginPage,
  NotFoundPage,
  ProductDetailPage,
  RegisterPage,
} from './routes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <RouteErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="producto/:id" element={<ProductDetailPage />} />
                  <Route path="carrito" element={<CartPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="registro" element={<RegisterPage />} />
                  <Route
                    path="cuenta"
                    element={
                      <ProtectedRoute>
                        <AccountPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute role="admin">
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
