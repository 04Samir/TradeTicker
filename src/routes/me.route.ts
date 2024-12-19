import { Request, Response, Router } from 'express';

import { db } from '../database';
import { isAuthenticated } from '../middleware';
import { responder } from '../utils';

const router = Router();

router.use(isAuthenticated);

router.get('/', async (req: Request, res: Response) => {
    return res.redirect(`${res.locals.basePath}/@me/dashboard`);
});

router.get('/dashboard', async (req: Request, res: Response) => {
    const [userRows] = await db.query(
        'SELECT Username FROM Users WHERE ID = ?',
        [req.session!.user.id],
    );

    if (!Array.isArray(userRows) || userRows.length === 0) {
        return res.redirect(`${res.locals.basePath}/auth/logout`);
    }

    const user = userRows[0] as any;

    const [watchlistRows] = await db.query(
        'SELECT Symbol FROM Watchlist WHERE UserID = ? ORDER BY CreatedAt DESC',
        [req.session!.user.id],
    );

    const watchlist = Array.isArray(watchlistRows) ? watchlistRows : [];

    return res.render('layout', {
        basePath: res.locals.basePath,
        title: 'Dashboard',
        view: 'dashboard',
        username: user.Username,
        watchlist,
    });
});

router.get('/profile', async (req: Request, res: Response) => {
    return responder.error(res, 501);
});

router.get('/security', async (req: Request, res: Response) => {
    return responder.error(res, 501);
});

router.get('/information', async (req: Request, res: Response) => {
    return responder.error(res, 501);
});

export default { router, path: '/@me' };
