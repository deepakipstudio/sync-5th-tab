import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config';
import { authRedirect, authCallback, authLogout } from './routes/auth';
import { getTenantProducts } from './routes/tenant';
import { postTenantBanner } from './routes/admin';
import { getMe } from './routes/me';
import { getTenantInfo } from './routes/tenantInfo';
import { getAdminAccount } from './routes/account';
import { debugMTEndpoints } from './routes/debug';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

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
app.post('/admin/:tenant/banners', postTenantBanner);

// Debug routes (remove in production)
app.get('/debug/mt-endpoints/:tenant', debugMTEndpoints);

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
