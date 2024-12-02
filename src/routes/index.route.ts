import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    res.render('index', { title: 'Home' });
});

export default { router, path: '/' };
