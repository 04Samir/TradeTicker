import { Request, Response, Router } from 'express';

import { isAuthenticated } from '../middleware';
import { json } from '../utils';

const router = Router();

router.get('/', isAuthenticated, async (req: Request, res: Response) => {
    return json.respond(res, 200, req.session!.user);
});

export default { router, path: '/@me' };
