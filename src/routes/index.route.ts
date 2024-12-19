import { Request, Response, Router } from 'express';

import { formatDistanceToNow } from 'date-fns';

import { db } from '../database';
import { HTTPError, json, local, yahoo } from '../utils';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    let news;

    const response = await local.get('/api/markets/news', {
        params: { amount: 9 },
    });

    if (response.status !== 200) {
        news = [];
    } else {
        news = response.data.data.news.map((article: any) => {
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

    const response = await yahoo.get('/v1/finance/search', {
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

    if (response.status !== 200) {
        const error: HTTPError = new Error(
            JSON.stringify(response.data || response.statusText),
        );
        error.status = 500;
        throw error;
    } else {
        const quotes = response.data.quotes
            .filter((quote: any) =>
                ['EQUITY', 'CRYPTOCURRENCY'].includes(quote.quoteType),
            )
            .map((quote: any) => ({
                ...quote,
                category: quote.quoteType === 'EQUITY' ? 'Stocks' : 'Crypto',
            }));

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

router.get('/symbol/:symbol', async (req: Request, res: Response) => {
    const { symbol } = req.params;

    if (!symbol) {
        res.status(400);
        return res.render('layout', {
            title: 'Symbol',
            view: 'symbol',
            symbol: {},
            news: [],
        });
    }

    const symbolResp = await yahoo.get('/v1/finance/quoteType/', {
        params: {
            symbol,
            lang: 'en-US',
            region: 'US',
        },
    });

    if (symbolResp.status !== 200) {
        res.status(404);
        return res.render('layout', {
            title: 'Symbol',
            view: 'symbol',
            symbol: {},
            news: [],
        });
    }

    if (symbolResp.data.quoteType.result.length === 0) {
        res.status(404);
        return res.render('layout', {
            title: 'Symbol',
            view: 'symbol',
            symbol: {},
            news: [],
        });
    }

    const actualSymbol: { ticker?: string; symbol?: string; name?: string } =
        {};
    if (
        symbolResp.data.quoteType.result[0].symbol.charAt(
            symbolResp.data.quoteType.result[0].symbol.length - 4,
        ) === '-'
    ) {
        actualSymbol.symbol = `${symbolResp.data.quoteType.result[0].symbol.slice(0, -4)}/${symbolResp.data.quoteType.result[0].symbol.slice(-3)}`;
    } else {
        actualSymbol.symbol = symbolResp.data.quoteType.result[0].symbol;
    }
    actualSymbol.ticker = symbolResp.data.quoteType.result[0].symbol;
    actualSymbol.name = symbolResp.data.quoteType.result[0].longName;

    let isWatchlisted = false;
    if (req.session?.user) {
        const [rows] = await db.query(
            'SELECT * FROM Watchlist WHERE UserID = ? AND Symbol = ?',
            [req.session.user.id, actualSymbol.ticker],
        );

        if (Array.isArray(rows) && rows.length > 0) {
            isWatchlisted = true;
        }
    }

    let news;
    const newsResp = await local.get('/api/markets/news', {
        params: { amount: 10, symbols: actualSymbol.symbol },
    });

    if (newsResp.status !== 200) {
        news = [];
    } else {
        news = newsResp.data.data.news.map((article: any) => {
            return {
                ...article,
                relativeTime: formatDistanceToNow(
                    new Date(article.updated_at),
                    { addSuffix: true },
                ),
            };
        });
    }

    res.render('layout', {
        title: actualSymbol.symbol,
        view: 'symbol',
        symbol: actualSymbol,
        watchlisted: isWatchlisted,
        news,
    });
});

export default { router, path: '/' };
