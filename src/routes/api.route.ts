import { Request, Response, Router } from 'express';

import { HTTPError, json, markets } from '../utils';

const router = Router();

router.get('/markets/:type/movers', async (req: Request, res: Response) => {
    const { type } = req.params;

    if (type.toLowerCase() === 'stocks') {
        const timeframes = ['1D', '1W', '1M', '6M', '1Y', '5Y'];

        function calculateInterval(timeframe: string): string {
            switch (timeframe) {
                case '1D':
                    return '1H';
                case '1W':
                    return '1D';
                case '1M':
                    return '1W';
                case '6M':
                    return '1M';
                case '1Y':
                    return '1M';
                case '5Y':
                    return '12M';
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
        ): { start: string; end: string } {
            const endDate = adjustToWeekday(new Date(end));
            let startDate: Date;

            switch (timeframe) {
                case '1D':
                    startDate = new Date(endDate);
                    startDate.setHours(0, 0, 0, 0);
                    startDate = adjustToWeekday(startDate);
                    break;
                case '1W':
                    startDate = new Date(endDate);
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case '1M':
                    startDate = new Date(endDate);
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case '6M':
                    startDate = new Date(endDate);
                    startDate.setMonth(startDate.getMonth() - 6);
                    break;
                case '1Y':
                    startDate = new Date(endDate);
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                case '5Y':
                    startDate = new Date(endDate);
                    startDate.setFullYear(startDate.getFullYear() - 5);
                    break;
                default:
                    throw new Error(`Unsupported Timeframe (!?): ${timeframe}`);
            }

            return {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            };
        }

        const activeStocks = await markets.get(
            '/v1beta1/screener/stocks/most-actives',
            {
                params: {
                    by: 'trades',
                    top: 3,
                },
            },
        );
        if (activeStocks.status !== 200) {
            const error: HTTPError = new Error(
                JSON.stringify(activeStocks.data || activeStocks.statusText),
            );
            error.status = 500;
            throw error;
        }

        const stockSymbols = activeStocks.data.most_actives.map(
            (stock: any) => stock.symbol,
        );

        const stockEndDate = new Date(activeStocks.data.last_updated)
            .toISOString()
            .split('T')[0];

        async function fetchStockDataForTimeframe(
            timeframe: string,
            stockSymbols: string[],
            endDate: string,
        ) {
            const { start, end } = calculateDate(timeframe, endDate);
            const symbolData = await markets.get('/v2/stocks/bars', {
                params: {
                    symbols: stockSymbols.join(','),
                    timeframe: calculateInterval(timeframe),
                    start: start,
                    end: end,
                    limit: 10000,
                    feed: 'iex',
                },
            });
            if (symbolData.status !== 200) {
                const error: HTTPError = new Error(
                    JSON.stringify(symbolData.data || symbolData.statusText),
                );
                error.status = 500;
                throw error;
            } else {
                return symbolData.data;
            }
        }

        const stockData: { [key: string]: any } = {};
        for (const timeframe of timeframes) {
            stockData[timeframe] = await fetchStockDataForTimeframe(
                timeframe,
                stockSymbols,
                stockEndDate,
            );
        }

        return json.respond(res, 200, {
            data: stockData,
        });
    } else if (type.toLowerCase() === 'cryptos') {
        return json.error(res, 500, 'Not Implemented');
    } else {
        return json.error(res, 400, 'Invalid Market Type');
    }
});

export default { router, path: '/api' };
