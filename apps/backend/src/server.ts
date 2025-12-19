import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import { env } from './config';
import { authRedirect, authCallback, authLogout } from './routes/auth';
import { getTenantProducts } from './routes/tenant';
import {
  getTenantBanners,
  getTenantBanner,
  postTenantBanner,
  putTenantBanner,
  deleteTenantBanner,
  uploadBannerImage,
  handleMulterError,
  uploadProductImages,
} from './routes/admin';
import {
  getTenantProducts as getAdminTenantProducts,
  searchMTProducts,
  getMTProductForAdd,
  postTenantProduct,
  getTenantProduct,
  putTenantProduct,
  deleteTenantProduct,
  getProductVariants,
  getProductVariant,
  putProductVariant,
  syncProducts,
} from './routes/products';
import { getMe } from './routes/me';
import { getTenantInfo } from './routes/tenantInfo';
import { getAdminAccount } from './routes/account';
import { debugMTEndpoints } from './routes/debug';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Auth routes
app.get('/auth/mt/redirect', authRedirect);
app.post('/auth/mt/callback', authCallback);
app.post('/auth/logout', authLogout);
app.get('/me', getMe);

// Tenant info
app.get('/tenants/:id', getTenantInfo);

// Tenant/customer routes
app.get('/:tenant/products', getTenantProducts);

// Admin routes
app.get('/admin/:tenant/account', getAdminAccount);

// Banner routes
app.get('/admin/:tenant/banners', getTenantBanners);
app.get('/admin/:tenant/banners/:id', getTenantBanner);
app.post('/admin/:tenant/banners', uploadBannerImage, handleMulterError, postTenantBanner);
app.put('/admin/:tenant/banners/:id', uploadBannerImage, handleMulterError, putTenantBanner);
app.delete('/admin/:tenant/banners/:id', deleteTenantBanner);

// Product routes
app.get('/admin/:tenant/products', getAdminTenantProducts);
app.get('/admin/:tenant/products/mt/search', searchMTProducts);
app.get('/admin/:tenant/products/add', getMTProductForAdd);
app.post('/admin/:tenant/products', uploadProductImages, handleMulterError, postTenantProduct);
app.get('/admin/:tenant/products/:id', getTenantProduct);
app.put('/admin/:tenant/products/:id', uploadProductImages, handleMulterError, putTenantProduct);
app.delete('/admin/:tenant/products/:id', deleteTenantProduct);
app.get('/admin/:tenant/products/:id/variants', getProductVariants);
app.get('/admin/:tenant/products/variants/:id', getProductVariant);
app.put('/admin/:tenant/products/variants/:id', uploadProductImages, handleMulterError, putProductVariant);
app.post('/admin/:tenant/products/sync', syncProducts);

// Debug routes (remove in production)
app.get('/debug/mt-endpoints/:tenant', debugMTEndpoints);

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
