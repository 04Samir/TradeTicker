import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    res.render('layout', { title: 'Home', view: 'index' });
});

export default { router, path: '/' };
