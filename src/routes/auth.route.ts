import { Request, Response, Router } from 'express';

import bcrypt from 'bcrypt';

import { db } from '../database';
import { local } from '../utils';
import { json } from '../utils';

const router = Router();

const PEPPER = 'P3PP3R';

router.get('/', (req: Request, res: Response) => {
    res.render('layout', {
        title: 'Auth',
        view: 'auth',
        type: 'login',
        nav: false,
        footer: false,
    });
});

router.post('/validate/username', (req: Request, res: Response) => {
    const { username } = req.body;

    if (!username) {
        return json.error(res, 400, 'Username is Required');
    }

    const minLength = 3;
    const maxLength = 20;
    const validUsername = /^[a-zA-Z0-9_]+$/.test(username);

    if (username.length < minLength) {
        return json.error(
            res,
            400,
            `Username Requires at Least ${minLength} Characters`,
        );
    }
    if (username.length > maxLength) {
        return json.error(
            res,
            400,
            `Username Cannot Exceed ${maxLength} Characters`,
        );
    }
    if (!validUsername) {
        return json.error(
            res,
            400,
            'Username Can Only Contain Lowercase Letters, Numbers & Underscores',
        );
    }

    return json.respond(res, 200);
});

router.post('/validate/password', (req: Request, res: Response) => {
    const { password } = req.body;

    if (!password) {
        return json.error(res, 400, 'Password is Required');
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return json.error(
            res,
            400,
            `Password Requires at Least ${minLength} Characters`,
        );
    }
    if (!hasUpperCase) {
        return json.error(
            res,
            400,
            'Password is Missing at Least 1 Uppercase Letter',
        );
    }
    if (!hasLowerCase) {
        return json.error(
            res,
            400,
            'Password is Missing at Least 1 Lowercase Letter',
        );
    }
    if (!hasNumbers) {
        return json.error(res, 400, 'Password is Missing at Least 1 Number');
    }
    if (!hasSpecialChar) {
        return json.error(
            res,
            400,
            'Password is Missing at Least 1 Special Character',
        );
    }

    return json.respond(res, 200);
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password, confirmedPassword } = req.body;

        if (!username || !password || !confirmedPassword) {
            return json.error(res, 400, 'All Fields are Required');
        }

        if (password !== confirmedPassword) {
            return json.error(res, 400, 'Passwords do NOT Match');
        }

        const validUsername = await local.post('/auth/validate/username', {
            username,
        });
        if (validUsername.status !== 200) {
            return json.error(res, 400, validUsername.data.error.message);
        }

        const validPassword = await local.post('/auth/validate/password', {
            password,
        });
        if (validPassword.status !== 200) {
            return json.error(res, 400, validPassword.data.error.message);
        }

        const [rows] = await db.query(
            'SELECT ID FROM Users WHERE Username = ?',
            [username.toLowerCase()],
        );
        if (Array.isArray(rows) && rows.length > 0) {
            return json.error(res, 400, 'Username is Already Taken');
        }

        const hashedPassword = await bcrypt.hash(password + PEPPER, 10);
        await db.query('INSERT INTO Users (Username, Password) VALUES (?, ?)', [
            username.toLowerCase(),
            hashedPassword,
        ]);

        return json.respond(res, 201, {
            message: 'Registration Successful',
        });
    } catch (error) {
        console.error('Error in /register:', error);
        return json.error(res, 500);
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return json.error(res, 400, 'Username and Password are Required');
        }

        const [rows] = await db.query(
            'SELECT ID, Username, Password FROM Users WHERE Username = ?',
            [username.toLowerCase()],
        );
        if (!Array.isArray(rows) || rows.length === 0) {
            return json.error(res, 400, 'Invalid Username or Password');
        }

        const user: any = rows[0];
        if (!user) {
            return json.error(res, 400, 'Invalid Username or Password');
        }

        const match = await bcrypt.compare(password + PEPPER, user.Password);
        if (!match) {
            return json.error(res, 400, 'Invalid Username or Password');
        }

        return json.respond(res, 200, { message: 'Login Successful' });
    } catch (error) {
        console.error('Error in /login:', error);
        return json.error(res, 500, 'Internal Server Error');
    }
});

export default { router, path: '/auth' };
