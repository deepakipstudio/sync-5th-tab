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
  getStoreSettings,
  updateBrandSettings,
  getTenantSettings,
  syncBrand,
  uploadBannerImage,
  handleMulterError,
  uploadProductImages,
  uploadCategoryImage,
} from './routes/admin';
import {
  getTenantProducts as getAdminTenantProducts,
  searchMTProducts,
  getMTProductForAdd,
  postTenantProduct,
  getTenantProduct,
  putTenantProduct,
  deleteTenantProduct,
  getTenantProductByMtId,
  putTenantProductByMtId,
  deleteTenantProductByMtId,
  getProductVariants,
  getProductVariantsByMtId,
  getProductVariant,
  putProductVariant,
  getProductVariantByMtId,
  putProductVariantByMtId,
  syncProducts,
  checkProductExists,
} from './routes/products';
import { getMe } from './routes/me';
import { getTenantInfo, getTenantBranding } from './routes/tenantInfo';
import { getAdminAccount } from './routes/account';
import { debugMTEndpoints } from './routes/debug';
import {
  getTenantCategories,
  getTenantCategory,
  postTenantCategory,
  putTenantCategory,
  deleteTenantCategory,
  postCategoryProducts,
  deleteCategoryProduct,
  putCategoriesReorder,
  checkSlugAvailability,
  generateUniqueSlugFromName,
} from './routes/categories';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
// Note: express.urlencoded removed - multer handles multipart/form-data parsing including text fields
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
app.get('/tenants/:id/branding', getTenantBranding);

// Tenant/customer routes
app.get('/:tenant/products', getTenantProducts);

// Admin routes
app.get('/admin/:tenant/account', getAdminAccount);

// Store settings routes
app.get('/admin/:tenant/settings', getTenantSettings);
app.post('/admin/:tenant/sync-brand', syncBrand);
app.get('/admin/:tenant/store-settings', getStoreSettings);
app.put('/admin/:tenant/store-settings/brand', updateBrandSettings);

// Banner routes
app.get('/admin/:tenant/banners', getTenantBanners);
app.get('/admin/:tenant/banners/:id', getTenantBanner);
app.post('/admin/:tenant/banners', uploadBannerImage, handleMulterError, postTenantBanner);
app.put('/admin/:tenant/banners/:id', uploadBannerImage, handleMulterError, putTenantBanner);
app.delete('/admin/:tenant/banners/:id', deleteTenantBanner);

// Category routes
app.get('/admin/:tenant/categories', getTenantCategories);
app.get('/admin/:tenant/categories/check-slug', checkSlugAvailability);
app.get('/admin/:tenant/categories/generate-slug', generateUniqueSlugFromName);
app.get('/admin/:tenant/categories/:id', getTenantCategory);
app.post('/admin/:tenant/categories', uploadCategoryImage, handleMulterError, postTenantCategory);
app.put('/admin/:tenant/categories/:id', uploadCategoryImage, handleMulterError, putTenantCategory);
app.delete('/admin/:tenant/categories/:id', deleteTenantCategory);
app.post('/admin/:tenant/categories/:id/products', postCategoryProducts);
app.delete('/admin/:tenant/categories/:id/products/:productId', deleteCategoryProduct);
app.put('/admin/:tenant/categories/reorder', putCategoriesReorder);

// Product routes
app.get('/admin/:tenant/products', getAdminTenantProducts);
app.get('/admin/:tenant/products/mt/search', searchMTProducts);
app.get('/admin/:tenant/products/check/:mtProductId', checkProductExists);
app.get('/admin/:tenant/products/add', getMTProductForAdd);
app.post('/admin/:tenant/products', uploadProductImages, handleMulterError, postTenantProduct);
// MT product ID-based routes (new)
app.get('/admin/:tenant/products/mt/:mtProductId', getTenantProductByMtId);
app.put('/admin/:tenant/products/mt/:mtProductId', uploadProductImages, handleMulterError, putTenantProductByMtId);
app.delete('/admin/:tenant/products/mt/:mtProductId', deleteTenantProductByMtId);
app.get('/admin/:tenant/products/mt/:mtProductId/variants', getProductVariantsByMtId);
app.get('/admin/:tenant/products/mt/:mtProductId/variants/:mtVariantId', getProductVariantByMtId);
app.put('/admin/:tenant/products/mt/:mtProductId/variants/:mtVariantId', uploadProductImages, handleMulterError, putProductVariantByMtId);
// UUID-based routes (kept for backward compatibility)
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
