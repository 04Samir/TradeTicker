import { Request, Response, Router } from 'express';

import { db } from '../database';
import { isAuthenticated, refreshToken } from '../middleware';
import { HTTPError, markets, responder } from '../utils';

const router = Router();

const timeframes = ['1D', '1W', '1M', '6M', '1Y', '5Y'];

function calculateInterval(timeframe: string): string {
    switch (timeframe) {
        case '1D':
            return '1T';
        case '1W':
            return '30T';
        case '1M':
            return '1D';
        case '6M':
            return '1D';
        case '1Y':
            return '1D';
        case '5Y':
            return '1W';
        default:
            throw new Error(`Unsupported Timeframe (!?): ${timeframe}`);
    }
}

function adjustToWeekday(date: Date): Date {
    const day = date.getDay();
    if (day === 0) {
        date.setDate(date.getDate() - 2);
    } else if (day === 6) {
        date.setDate(date.getDate() - 1);
    }
    return date;
}

function calculateDate(
    timeframe: string,
    end: string,
    onlyWeekdays: boolean,
): { start: string; end: string } {
    let endDate = new Date(end);
    if (onlyWeekdays) {
        endDate = adjustToWeekday(endDate);
    }

    const startDate = new Date(endDate);

    switch (timeframe) {
        case '1D':
            startDate.setHours(0, 0, 0, 0);
            break;
        case '1W':
            if (endDate.getHours() >= 18) {
                startDate.setDate(endDate.getDate() - 7 + 1);
                startDate.setHours(0, 0, 0, 0);
            } else {
                startDate.setDate(startDate.getDate() - 7);
            }
            break;
        case '1M':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case '6M':
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        case '1Y':
            if (endDate.getMonth() === 11) {
                startDate.setFullYear(startDate.getFullYear() - 1);
                startDate.setMonth(0);
            } else {
                startDate.setFullYear(startDate.getFullYear() - 1);
            }
            break;
        case '5Y':
            startDate.setFullYear(startDate.getFullYear() - 5);
            break;
        default:
            throw new Error(`Unsupported Timeframe (!?): ${timeframe}`);
    }

    return {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
    };
}

async function fetchData(
    url: string,
    skipNextPageToken: boolean,
    params: any = {},
): Promise<any> {
    const response = await markets.get(url, { params: params });

    if (response.status !== 200) {
        const error: HTTPError = new Error(
            JSON.stringify(response.data || response.statusText),
        );
        error.status = 500;
        throw error;
    }

    if (response.data.next_page_token != null && !skipNextPageToken) {
        const next = await fetchData(url, false, {
            ...params,
            page_token: response.data.next_page_token,
        });

        for (const key in next) {
            if (Array.isArray(response.data[key]) && Array.isArray(next[key])) {
                response.data[key] = [...response.data[key], ...next[key]];
            } else if (
                typeof response.data[key] === 'object' &&
                typeof next[key] === 'object'
            ) {
                response.data[key] = {
                    ...response.data[key],
                    ...next[key],
                };
            } else {
                response.data[key] = next[key];
            }
        }
    }
    delete response.data.next_page_token;
    return response.data;
}

async function fetchSymbolBars(
    symbols: string[],
    type: 'stocks' | 'crypto',
    endDate?: string,
) {
    const api =
        type === 'stocks' ? '/v2/stocks/bars' : '/v1beta3/crypto/us/bars';

    const barsData: { [key: string]: any } = {};
    const currentEndDate =
        endDate || new Date(new Date().toUTCString()).toISOString();

    for (const timeframe of timeframes) {
        const { start, end } = calculateDate(
            timeframe,
            currentEndDate,
            type === 'stocks',
        );

        const symbolData = await fetchData(api, false, {
            symbols: symbols.join(','),
            timeframe: calculateInterval(timeframe),
            start: start,
            end: end,
            limit: 10000,
            feed: type === 'stocks' ? 'iex' : undefined,
        });

        for (const symbol of symbols) {
            if (!barsData[symbol]) {
                barsData[symbol] = { bars: {} };
            }

            if (
                Object.keys(symbolData.bars).length === 0 &&
                timeframe === '1D'
            ) {
                const previousDay = new Date(end);
                previousDay.setDate(previousDay.getDate() - 1);

                const previousDayData = await fetchData(api, false, {
                    symbols: symbol,
                    timeframe: calculateInterval(timeframe),
                    start: calculateDate(
                        timeframe,
                        previousDay.toISOString(),
                        type === 'stocks',
                    ).start,
                    end: end,
                    limit: 10000,
                    feed: type === 'stocks' ? 'iex' : undefined,
                });

                barsData[symbol].bars[timeframe] =
                    previousDayData.bars[symbol] || [];
            } else {
                barsData[symbol].bars[timeframe] =
                    symbolData.bars[symbol] || [];
            }
        }
    }

    return barsData;
}

router.post('/auth/refresh', refreshToken);

router.get('/@me', async (req: Request, res: Response) => {
    if (req.session?.user) {
        return responder.send(res, 200, { user: req.session.user });
    } else {
        return responder.error(res, 401);
    }
});

router.get(
    '/@me/watchlist',
    isAuthenticated,
    async (req: Request, res: Response) => {
        const [rows] = await db.query(
            'SELECT Symbol FROM Watchlist WHERE UserID = ?',
            [req.session!.user.id],
        );
        return responder.send(res, 200, { watchlist: rows });
    },
);

router.post(
    '/@me/watchlist/:symbol',
    isAuthenticated,
    async (req: Request, res: Response) => {
        const { symbol } = req.params;

        const [rows] = await db.query(
            'SELECT ID FROM Watchlist WHERE UserID = ? AND Symbol = ?',
            [req.session!.user.id, symbol],
        );
        if (Array.isArray(rows) && rows.length > 0) {
            return responder.send(res, 200, {
                message: 'Already in Watchlist',
            });
        }

        await db.query('INSERT INTO Watchlist (UserID, Symbol) VALUES (?, ?)', [
            req.session!.user.id,
            symbol,
        ]);
        return responder.send(res, 201, { message: 'Added to Watchlist' });
    },
);

router.put(
    '/@me/watchlist/:symbol',
    isAuthenticated,
    async (req: Request, res: Response) => {
        const { symbol } = req.params;

        const [rows] = await db.query(
            'SELECT ID FROM Watchlist WHERE UserID = ? AND Symbol = ?',
            [req.session!.user.id, symbol],
        );
        if (Array.isArray(rows) && rows.length > 0) {
            await db.query(
                'DELETE FROM Watchlist WHERE UserID = ? AND Symbol = ?',
                [req.session!.user.id, symbol],
            );
            return responder.send(res, 200, {
                message: 'Removed from Watchlist',
            });
        } else {
            await db.query(
                'INSERT INTO Watchlist (UserID, Symbol) VALUES (?, ?)',
                [req.session!.user.id, symbol],
            );
            return responder.send(res, 201, {
                message: 'Added to Watchlist',
            });
        }
    },
);

router.delete(
    '/@me/watchlist/:symbol',
    isAuthenticated,
    async (req: Request, res: Response) => {
        const { symbol } = req.params;

        const [rows] = await db.query(
            'SELECT ID FROM Watchlist WHERE UserID = ? AND Symbol = ?',
            [req.session!.user.id, symbol],
        );
        if (!Array.isArray(rows) || rows.length === 0) {
            return responder.send(res, 200, { message: 'Not in Watchlist' });
        }

        await db.query(
            'DELETE FROM Watchlist WHERE UserID = ? AND Symbol = ?',
            [req.session!.user.id, symbol],
        );
        return responder.send(res, 200, {
            message: 'Removed from Watchlist',
        });
    },
);

router.get('/markets/:type/movers', async (req: Request, res: Response) => {
    const { type } = req.params;

    if (type.toLowerCase() === 'stocks') {
        const activeStocks = await fetchData(
            '/v1beta1/screener/stocks/most-actives',
            false,
            { by: 'trades', top: 3 },
        );

        const stockSymbols = activeStocks.most_actives.map(
            (stock: any) => stock.symbol,
        );
        const stockEndDate = new Date(activeStocks.last_updated).toISOString();

        const stockData = await fetchSymbolBars(
            stockSymbols,
            'stocks',
            stockEndDate,
        );

        return responder.send(res, 200, { data: stockData });
    } else if (type.toLowerCase() === 'crypto') {
        const cryptoSymbols = ['BTC/USD', 'ETH/USD', 'DOGE/USD'];

        const cryptoData = await fetchSymbolBars(cryptoSymbols, 'crypto');
        return responder.send(res, 200, { data: cryptoData });
    } else {
        return responder.error(res, 400, 'Invalid Market Type');
    }
});

router.get('/markets/news', async (req: Request, res: Response) => {
    const { amount, symbols } = req.query;
    const amt = parseInt(amount as string);

    if (isNaN(amt) || amt <= 0) {
        return responder.error(res, 400, 'Invalid Amount Query');
    }

    const start = new Date(
        new Date().setDate(new Date().getDate() - 3),
    ).toISOString();

    let news: any[] = [];
    let endTime = null;
    const seenIds = new Set<number>();

    while (news.length < amt) {
        const params: any = {
            limit: amt - news.length + 1,
            include_content: false,
            exclude_contentless: false,
            start: start,
        };
        if (endTime) {
            params.end = endTime;
        }
        if (symbols) {
            params.symbols = symbols;
        }

        const response = await markets.get('/v1beta1/news', {
            params,
        });
        if (response.status !== 200) {
            const error: HTTPError = new Error(
                JSON.stringify(response.data || response.statusText),
            );
            error.status = 500;
            throw error;
        }

        if (response.data.news.length === 0) {
            break;
        }

        endTime = response.data.news[response.data.news.length - 1].updated_at;

        const toRemove: any[] = [];
        for (const article of response.data.news) {
            if (
                article.symbols.length === 0 ||
                article.images.length === 0 ||
                seenIds.has(article.id)
            ) {
                toRemove.push(article.id);
            } else {
                seenIds.add(article.id);
            }
        }

        news = [
            ...news,
            ...response.data.news.filter(
                (article: any) => !toRemove.includes(article.id),
            ),
        ];
    }

    return responder.send(res, 200, {
        data: { news: news.slice(0, amt) },
    });
});

router.get('/markets/bars', async (req: Request, res: Response) => {
    const { symbols } = req.query;

    if (!symbols) {
        return responder.error(res, 400, 'Symbols are Required');
    }

    const symbolList = (symbols as string).split(',').map((s) => s.trim());

    if (symbolList.length === 0) {
        return responder.error(res, 400, 'Invalid Symbols Provided');
    }

    const symbolData: Record<string, any> = {};
    const stockSymbols: string[] = [];
    const cryptoSymbols: string[] = [];

    symbolList.forEach((symbol) => {
        let actualSymbol = symbol;
        let type: 'stocks' | 'crypto' = 'stocks';

        if (symbol.charAt(symbol.length - 4) === '-') {
            actualSymbol = `${symbol.slice(0, -4)}/${symbol.slice(-3)}`;
        }
        if (actualSymbol.charAt(actualSymbol.length - 4) === '/') {
            type = 'crypto';
        }

        if (type === 'stocks') {
            stockSymbols.push(actualSymbol);
        } else {
            cryptoSymbols.push(actualSymbol);
        }
    });

    if (stockSymbols.length > 0) {
        const stockData = await fetchSymbolBars(stockSymbols, 'stocks');
        Object.assign(symbolData, stockData);
    }

    if (cryptoSymbols.length > 0) {
        const cryptoData = await fetchSymbolBars(cryptoSymbols, 'crypto');
        Object.assign(symbolData, cryptoData);
    }

    if (Object.keys(symbolData).length === 0) {
        return responder.error(res, 404, 'No Symbol Data Found');
    }

    return responder.send(res, 200, { data: symbolData });
});

export default { router, path: '/api' };
