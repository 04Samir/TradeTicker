import { Request, Response, Router } from 'express';

import { formatDistanceToNow } from 'date-fns';

import { local } from '../utils';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    let news;

    const data = await local.get('/api/markets/news', {
        params: { amount: 9 },
    });

    if (data.status !== 200) {
        news = [];
    } else {
        news = data.data.data.news.map((article: any) => {
            return {
                ...article,
                relativeTime: formatDistanceToNow(
                    new Date(article.updated_at),
                    { addSuffix: true },
                ),
            };
        });
    }

    res.render('layout', { title: 'Home', view: 'index', news });
});

export default { router, path: '/' };
