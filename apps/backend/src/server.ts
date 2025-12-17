import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config';
import { authRedirect, authCallback } from './routes/auth';
import { getTenantProducts } from './routes/tenant';
import { postTenantBanner } from './routes/admin';
import { getMe } from './routes/me';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Auth routes
app.get('/auth/mt/redirect', authRedirect);
app.post('/auth/mt/callback', authCallback);
app.get('/me', getMe);

// Tenant/customer routes
app.get('/:tenant/products', getTenantProducts);

// Admin routes
app.post('/admin/:tenant/banners', postTenantBanner);

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
