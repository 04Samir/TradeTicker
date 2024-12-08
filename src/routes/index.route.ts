import { Request, Response, Router } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    res.render('layout', { title: 'Home', view: 'index' });
});

export default { router, path: '/' };
