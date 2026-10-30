import { lazyWithPreload } from './lib/lazyWithPreload';

/** Code splitting por ruta: cada página es un chunk independiente. */
export const ProductDetailPage = lazyWithPreload(() => import('./pages/ProductDetailPage'));
export const CartPage = lazyWithPreload(() => import('./pages/CartPage'));
export const LoginPage = lazyWithPreload(() => import('./pages/LoginPage'));
export const RegisterPage = lazyWithPreload(() => import('./pages/RegisterPage'));
export const AccountPage = lazyWithPreload(() => import('./pages/AccountPage'));
export const AdminPage = lazyWithPreload(() => import('./pages/AdminPage'));
export const NotFoundPage = lazyWithPreload(() => import('./pages/NotFoundPage'));

export const PRELOAD: Record<string, () => Promise<unknown>> = {
  '/carrito': CartPage.preload,
  '/login': LoginPage.preload,
  '/registro': RegisterPage.preload,
  '/cuenta': AccountPage.preload,
  '/admin': AdminPage.preload,
};
