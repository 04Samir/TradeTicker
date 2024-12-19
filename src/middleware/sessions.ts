import { NextFunction, Request, Response } from 'express';

import jwt from 'jsonwebtoken';

import { db } from '../database';
import { json } from '../utils';

const ACCESS_SECRET = process.env.ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_SECRET as string;

const ACCESS_TOKEN_EXPIRY = '15m'; // TODO: Change

const REFRESH_COOKIE = 'refresh_token';

const generateTokens = (user_id: number, version: number) => {
    const accessToken = jwt.sign({ id: user_id, version }, ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign({ id: user_id, version }, REFRESH_SECRET);

    return { accessToken, refreshToken };
};

export const createSession = async (
    res: Response,
    req: Request,
    user_id: number,
    version: number,
) => {
    const { accessToken, refreshToken } = generateTokens(user_id, version);

    await db.query(
        'INSERT INTO Sessions (UserID, RefreshToken) VALUES (?, ?)',
        [user_id, refreshToken],
    );

    req.session!.user = { id: user_id, version };
    res.cookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
    });

    return { accessToken, refreshToken };
};

export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (req.session?.user) {
        return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401);
        return res.format({
            json: () => json.error(res, 401),
            html: () =>
                res.redirect(
                    `/auth?redirect=${encodeURIComponent(req.originalUrl)}`,
                ),
        });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;

        const [rows] = await db.query(
            'SELECT ID, Version FROM Users WHERE ID = ?',
            [payload.id],
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            res.status(401);
            return res.format({
                json: () => json.error(res, 401),
                html: () =>
                    res.redirect(
                        `/auth?redirect=${encodeURIComponent(req.originalUrl)}`,
                    ),
            });
        }

        const user = rows[0] as any;
        if (user.version !== payload.version) {
            res.status(401);
            return res.format({
                json: () => json.error(res, 401),
                html: () =>
                    res.redirect(
                        `/auth?redirect=${encodeURIComponent(req.originalUrl)}`,
                    ),
            });
        }

        req.session!.user = payload as { id: number; version: number };
        next();
    } catch {
        res.status(401);
        return res.format({
            json: () => json.error(res, 401),
            html: () =>
                res.redirect(
                    `/auth?redirect=${encodeURIComponent(req.originalUrl)}`,
                ),
        });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies[REFRESH_COOKIE];
    if (!refreshToken) {
        return json.error(res, 401, 'Refresh Token Required');
    }

    try {
        const payload = jwt.verify(
            refreshToken,
            REFRESH_SECRET,
        ) as jwt.JwtPayload;

        const [rows] = await db.query(
            'SELECT UserID, RefreshToken FROM Sessions WHERE RefreshToken = ?',
            [refreshToken],
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            return json.error(res, 401, 'Invalid Refresh Token');
        }

        const session = rows[0] as any;

        const [userRows] = await db.query(
            'SELECT Version FROM Users WHERE ID = ?',
            [payload.id],
        );
        if (!Array.isArray(userRows) || userRows.length === 0) {
            return json.error(res, 401, 'User Not Found');
        }

        const user = userRows[0] as any;
        if (user.version !== Number(payload.version)) {
            return json.error(res, 401, 'Token Version Mismatch');
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(
            session.UserID,
            user.version,
        );

        await db.query(
            'UPDATE Sessions SET RefreshToken = ? WHERE UserID = ?',
            [newRefreshToken, session.UserID],
        );

        res.cookie(REFRESH_COOKIE, newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'strict',
        });

        json.respond(res, 201, { accessToken });
    } catch {
        return json.error(res, 401, 'Invalid or expired refresh token.');
    }
};

export const clearSession = async (req: Request, res: Response) => {
    const refreshToken = req.cookies[REFRESH_COOKIE];

    await db.query('DELETE FROM Sessions WHERE RefreshToken = ?', [
        refreshToken,
    ]);

    req.session = null;
    res.clearCookie(REFRESH_COOKIE);
};
