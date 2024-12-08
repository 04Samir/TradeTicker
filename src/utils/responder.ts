import { Response } from 'express';

type ErrorMessages = {
    [code: number]: {
        status: string;
        message: string;
    };
};

const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
    400: {
        status: 'Bad Request',
        message: 'Your Request was Invalid',
    },
    401: {
        status: 'Un-Authorised',
        message: 'You are Not Authorised to View this Resource',
    },
    403: {
        status: 'Forbidden',
        message: 'You are Forbidden from Viewing this Resource',
    },
    404: {
        status: 'Not Found',
        message: 'The Resource you Requested was Not Found',
    },
    405: {
        status: 'Method Not Allowed',
        message: 'The Method you Requested is Not Allowed',
    },
    500: {
        status: 'Internal Server Error',
        message: 'An Internal Server Error has Occured',
    },
};

export const json = {
    ERROR_MESSAGES: DEFAULT_ERROR_MESSAGES,

    respond: (
        res: Response,
        code: number,
        extra?: Record<string, any>,
    ): Response => {
        const response = {
            code,
            ...(extra || {}),
        };
        return res.status(code).json(response);
    },

    error: (res: Response, code: number, message?: string): Response => {
        const error = DEFAULT_ERROR_MESSAGES[code] || {
            status: 'Unknown Error',
            message: 'An Unknown Error has Occurred',
        };

        if (message) {
            error.message = message;
        }

        return json.respond(res, code, { error });
    },
};
