import { Request, Response, Router } from 'express';

import { refreshToken } from '../middleware';
import { HTTPError, json, markets } from '../utils';

const router = Router();

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

router.post('/auth/refresh', refreshToken);

router.get('/auth/@me', async (req: Request, res: Response) => {
    if (req.session?.user) {
        return json.respond(res, 200, req.session!.user);
    } else {
        return json.error(res, 401);
    }
});

router.get('/markets/:type/movers', async (req: Request, res: Response) => {
    const { type } = req.params;

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
        let startDate = new Date(endDate);

        if (onlyWeekdays) {
            endDate = adjustToWeekday(endDate);
        }

        switch (timeframe) {
            case '1D':
                startDate.setDate(startDate.getDate() - 1);
                if (onlyWeekdays) {
                    startDate = adjustToWeekday(startDate);
                }
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
                if (endDate.getMonth() === 11) {
                    startDate.setFullYear(startDate.getFullYear() - 5);
                    startDate.setMonth(0);
                } else {
                    startDate.setFullYear(startDate.getFullYear() - 5);
                }
                break;
            default:
                throw new Error(`Unsupported Timeframe (!?): ${timeframe}`);
        }

        return {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        };
    }

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

        const stockData: { [key: string]: any } = {};
        for (const timeframe of timeframes) {
            const { start, end } = calculateDate(timeframe, stockEndDate, true);
            const symbolData = await fetchData('/v2/stocks/bars', false, {
                symbols: stockSymbols.join(','),
                timeframe: calculateInterval(timeframe),
                start: start,
                end: end,
                limit: 10000,
                feed: 'iex',
            });

            if (
                Object.keys(symbolData.bars).length === 0 &&
                timeframe === '1D'
            ) {
                const previousDay = new Date(end);
                previousDay.setDate(previousDay.getDate() - 1);

                const previousDayData = await fetchData(
                    '/v2/stocks/bars',
                    false,
                    {
                        symbols: stockSymbols.join(','),
                        timeframe: calculateInterval(timeframe),
                        start: calculateDate(
                            timeframe,
                            previousDay.toISOString(),
                            true,
                        ).start,
                        end: previousDay.toISOString(),
                        limit: 10000,
                        feed: 'iex',
                    },
                );

                stockData[timeframe] = previousDayData;
            } else {
                stockData[timeframe] = symbolData;
            }
        }

        return json.respond(res, 200, {
            data: stockData,
        });
    } else if (type.toLowerCase() === 'crypto') {
        const cryptoSymbols = ['BTC/USD', 'ETH/USD', 'DOGE/USD'];
        const cryptoEndDate = new Date(new Date().toUTCString()).toISOString();

        const cryptoData: { [key: string]: any } = {};
        for (const timeframe of timeframes) {
            const { start, end } = calculateDate(
                timeframe,
                cryptoEndDate,
                false,
            );

            const symbolData = await fetchData(
                '/v1beta3/crypto/us/bars',
                false,
                {
                    symbols: cryptoSymbols.join(','),
                    timeframe: calculateInterval(timeframe),
                    start: start,
                    end: end,
                    limit: 10000,
                },
            );

            cryptoData[timeframe] = symbolData;
        }

        return json.respond(res, 200, {
            data: cryptoData,
        });
    } else {
        return json.error(res, 400, 'Invalid Market Type');
    }
});

router.get('/markets/news', async (req: Request, res: Response) => {
    const amount = parseInt(req.query.amount as string, 10);
    if (isNaN(amount) || amount <= 0) {
        return json.error(res, 400, 'Invalid Amount Query');
    }

    const start = new Date(
        new Date().setDate(new Date().getDate() - 3),
    ).toISOString();

    let news: any[] = [];
    let endTime = null;
    const seenIds = new Set<number>();

    while (news.length < amount) {
        const params: any = {
            limit: amount - news.length + 1,
            include_content: false,
            exclude_contentless: false,
            start: start,
        };
        if (endTime) {
            params.end = endTime;
        }

        const data = await markets.get('/v1beta1/news', {
            params,
        });
        if (data.status !== 200) {
            const error: HTTPError = new Error(
                JSON.stringify(data.data || data.statusText),
            );
            error.status = 500;
            throw error;
        }

        endTime = data.data.news[data.data.news.length - 1].updated_at;

        const toRemove: any[] = [];
        for (const article of data.data.news) {
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
            ...data.data.news.filter(
                (article: any) => !toRemove.includes(article.id),
            ),
        ];
    }

    return json.respond(res, 200, {
        data: { news: news.slice(0, amount) },
    });
});

export default { router, path: '/api' };
