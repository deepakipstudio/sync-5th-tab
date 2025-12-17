import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { env } from '../config';

export async function getMe(req: Request, res: Response) {
  try {
    const cookieName = env.COOKIE_NAME || 'sync5_session';
    const sessionId = req.cookies?.[cookieName];
    if (!sessionId) return res.status(401).json({ error: 'no session' });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(401).json({ error: 'invalid session' });
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ error: 'session expired' });
    }

    const user = await prisma.user.findFirst({
      where: { id: session.userId, tenantId: session.tenantId },
      select: { preferredLocationId: true },
    });

    return res.json({
      userId: session.userId,
      role: session.role,
      tenantId: session.tenantId,
      preferredLocationId: user?.preferredLocationId || null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
