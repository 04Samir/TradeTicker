import { NextFunction, Request, Response } from 'express';

import { responder } from './responder';

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
    let message =
        error.message || responder.ERROR_MESSAGES[statusCode]?.message;

    if (statusCode === 500) {
        message = responder.ERROR_MESSAGES[500].message;
        console.error(error);
    }

    res.status(statusCode);
    res.format({
        json: () => {
            res.type('json');
            responder.error(res, statusCode, message);
        },
        html: () => {
            res.type('html');
            return res.render('layout', {
                basePath: res.locals.basePath,
                title: statusCode,
                view: 'error',
                statusCode,
                short: responder.ERROR_MESSAGES[statusCode]?.status,
                long: responder.ERROR_MESSAGES[statusCode]?.message,
            });
        },
        default: () => {
            res.type('txt');
            res.send(`${statusCode} : ${message}`);
        },
    });
};
/* eslint-enable @typescript-eslint/no-unused-vars */
