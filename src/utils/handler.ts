import { NextFunction, Request, Response } from 'express';

import { json } from './responder';

export interface HTTPError extends Error {
    status?: number;
    message: string;
}

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const error: HTTPError = new Error('Not Found');
    error.status = 404;
    next(error);
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const errorHandler = (
    error: HTTPError,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const statusCode = error.status || 500;
    const message =
        error.message ||
        json.ERROR_MESSAGES[statusCode]?.message ||
        'Internal Server Error';

    res.status(statusCode);

    res.format({
        json: () => {
            res.type('json');
            json.error(res, statusCode, message);
        },
        default: () => {
            res.type('txt');
            res.send(`${statusCode} : ${message}`);
        },
    });

    if (statusCode === 500) {
        console.error(error);
    }
};
/* eslint-enable @typescript-eslint/no-unused-vars */
