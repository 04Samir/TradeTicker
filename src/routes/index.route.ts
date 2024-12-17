import { Request, Response, Router } from 'express';

import { formatDistanceToNow } from 'date-fns';

import { HTTPError, json, local, yahoo } from '../utils';

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

router.get('/about', async (req: Request, res: Response) => {
    res.render('layout', { title: 'About', view: 'about' });
});

router.get('/search', async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query) {
        res.status(400);
        return res.format({
            json: () => {
                json.respond(res, 400, { message: 'Query is required' });
            },
            html: () => {
                res.render('layout', {
                    title: 'Search',
                    view: 'search',
                    query: '',
                    quotes: [],
                });
            },
        });
    }

    const data = await yahoo.get('/v1/finance/search', {
        params: {
            q: query,
            lang: 'en-GB',
            region: 'GB',
            quotesQueryId: 'tss_match_phrase_query',
            multiQuoteQueryId: 'multi_quote_single_token_query',
            enableCb: false,
            enableNavLinks: true,
            enableCulturalAssets: true,
            enableNews: false,
            enableResearchReports: false,
            enableLists: false,
            quotesCount: 10,
        },
    });

    if (data.status !== 200) {
        const error: HTTPError = new Error(
            JSON.stringify(data.data || data.statusText),
        );
        error.status = 500;
        throw error;
    } else {
        const quotes = data.data.quotes
            .filter((quote: any) =>
                ['EQUITY', 'CRYPTOCURRENCY'].includes(quote.quoteType),
            )
            .map((quote: any) => ({
                ...quote,
                category: quote.quoteType === 'EQUITY' ? 'Stocks' : 'Crypto',
            }));

        console.log(quotes);

        res.status(200);
        return res.format({
            json: () => {
                json.respond(res, 200, { quotes });
            },
            html: () => {
                res.render('layout', {
                    title: 'Search',
                    view: 'search',
                    query,
                    quotes,
                });
            },
        });
    }
});

export default { router, path: '/' };
