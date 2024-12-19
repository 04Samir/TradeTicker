import { Request, Response, Router } from 'express';

import bcrypt from 'bcrypt';

import { db } from '../database';
import { clearSession, createSession, isAuthenticated } from '../middleware';
import { hcaptcha, local, responder } from '../utils';

const router = Router();

const PEPPER = process.env.AUTH_PEPPER as string;

router.get('/', async (req: Request, res: Response) => {
    if (req.session?.user) {
        return res.redirect(`${res.locals.basePath}/@me`);
    }

    res.render('layout', {
        basePath: res.locals.basePath,
        title: 'Auth',
        view: 'auth',
        type: 'login',
        nav: false,
        footer: false,
    });
});

router.post('/validate/username', async (req: Request, res: Response) => {
    const { username } = req.body;

    if (!username) {
        return responder.error(res, 400, 'Username is Required');
    }

    const minLength = 3;
    const maxLength = 20;
    const validUsername = /^[a-zA-Z0-9_]+$/.test(username);

    if (username.length < minLength) {
        return responder.error(
            res,
            400,
            `Username Requires at Least ${minLength} Characters`,
        );
    }
    if (username.length > maxLength) {
        return responder.error(
            res,
            400,
            `Username Cannot Exceed ${maxLength} Characters`,
        );
    }
    if (!validUsername) {
        return responder.error(
            res,
            400,
            'Username Can Only Contain Lowercase Letters, Numbers & Underscores',
        );
    }

    return responder.send(res, 200);
});

router.post('/validate/password', async (req: Request, res: Response) => {
    const { password } = req.body;

    if (!password) {
        return responder.error(res, 400, 'Password is Required');
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return responder.error(
            res,
            400,
            `Password Requires at Least ${minLength} Characters`,
        );
    }
    if (!hasUpperCase) {
        return responder.error(
            res,
            400,
            'Password is Missing at Least 1 Uppercase Letter',
        );
    }
    if (!hasLowerCase) {
        return responder.error(
            res,
            400,
            'Password is Missing at Least 1 Lowercase Letter',
        );
    }
    if (!hasNumbers) {
        return responder.error(
            res,
            400,
            'Password is Missing at Least 1 Number',
        );
    }
    if (!hasSpecialChar) {
        return responder.error(
            res,
            400,
            'Password is Missing at Least 1 Special Character',
        );
    }

    return responder.send(res, 200);
});

router.post('/register', async (req: Request, res: Response) => {
    if (req.session?.user) {
        return responder.error(res, 400, 'Already Logged In');
    }

    try {
        const { username, password, confirmedPassword, captcha } = req.body;

        if (!username || !password || !confirmedPassword) {
            return responder.error(res, 400, 'All Fields are Required');
        }
        if (!captcha) {
            return responder.error(res, 400, 'Captcha is Required');
        }

        if (password !== confirmedPassword) {
            return responder.error(res, 400, 'Passwords do NOT Match');
        }

        const captchaResponse = await hcaptcha.post('/siteverify', {
            secret: process.env.HCAPTCHA_SECRET,
            sitekey: '05ae038c-9720-4558-87f0-096e94c40c6e',
            response: captcha,
        });
        if (captchaResponse.status !== 200) {
            return responder.error(res, 400, 'Captcha Verification Failed');
        }
        if (!captchaResponse.data.success) {
            return responder.error(res, 400, 'Captcha Verification Failed');
        }

        const validUsername = await local.post('/auth/validate/username', {
            username,
        });
        if (validUsername.status !== 200) {
            return responder.error(res, 400, validUsername.data.error.message);
        }

        const validPassword = await local.post('/auth/validate/password', {
            password,
        });
        if (validPassword.status !== 200) {
            return responder.error(res, 400, validPassword.data.error.message);
        }

        const [rows] = await db.query(
            'SELECT ID FROM Users WHERE Username = ?',
            [username.toLowerCase()],
        );
        if (Array.isArray(rows) && rows.length > 0) {
            return responder.error(res, 400, 'Username is Already Taken');
        }

        const hashedPassword = await bcrypt.hash(password + PEPPER, 10);
        const [result] = await db.query(
            'INSERT INTO Users (Username, Password) VALUES (?, ?)',
            [username.toLowerCase(), hashedPassword],
        );

        const [userRows] = await db.query(
            'SELECT ID, Version FROM Users WHERE ID = ?',
            [(result as any).insertId],
        );
        if (!Array.isArray(userRows) || userRows.length === 0) {
            return responder.error(res, 500);
        }

        const user: any = userRows[0];
        const { accessToken } = await createSession(
            res,
            req,
            user.ID,
            user.Version,
        );

        return responder.send(res, 201, {
            message: 'Registration Successful',
            access_token: accessToken,
        });
    } catch (error) {
        console.error('Error in /register:', error);
        return responder.error(res, 500);
    }
});

router.post('/login', async (req: Request, res: Response) => {
    if (req.session?.user) {
        return responder.error(res, 400, 'Already Logged In');
    }

    try {
        const { username, password, captcha } = req.body;

        if (!username || !password) {
            return responder.error(
                res,
                400,
                'Username & Password are Required',
            );
        }
        if (!captcha) {
            return responder.error(res, 400, 'Captcha is Required');
        }

        const captchaResponse = await hcaptcha.post('/siteverify', {
            secret: process.env.HCAPTCHA_SECRET,
            sitekey: '05ae038c-9720-4558-87f0-096e94c40c6e',
            response: captcha,
        });
        if (captchaResponse.status !== 200) {
            return responder.error(res, 400, 'Captcha Verification Failed');
        }
        if (!captchaResponse.data.success) {
            return responder.error(res, 400, 'Captcha Verification Failed');
        }

        const [rows] = await db.query(
            'SELECT * FROM Users WHERE Username = ?',
            [username.toLowerCase()],
        );
        if (!Array.isArray(rows) || rows.length === 0) {
            return responder.error(res, 400, 'Invalid Username or Password');
        }

        const user: any = rows[0];
        if (!user) {
            return responder.error(res, 400, 'Invalid Username or Password');
        }

        const match = await bcrypt.compare(password + PEPPER, user.Password);
        if (!match) {
            return responder.error(res, 400, 'Invalid Username or Password');
        }

        const { accessToken } = await createSession(
            res,
            req,
            user.ID,
            user.Version,
        );

        return responder.send(res, 201, {
            message: 'Login Successful',
            access_token: accessToken,
        });
    } catch (error) {
        console.error('Error in /login:', error);
        return responder.error(res, 500, 'Internal Server Error');
    }
});

router.get('/logout', isAuthenticated, async (req: Request, res: Response) => {
    await clearSession(req, res);
    return res.redirect('/');
});

export default { router, path: '/auth' };
