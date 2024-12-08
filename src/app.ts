import express from 'express';

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { db } from './database';
import { errorHandler, notFoundHandler } from './utils';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../dist/public')));
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

const loadRoutes = async () => {
    await Promise.all(
        fs.readdirSync(path.resolve(__dirname, 'routes')).map(async (file) => {
            if (file.endsWith('.route.ts') || file.endsWith('.route.js')) {
                const routeModule = await import(`./routes/${file}`);
                const { router, path: routePath } = routeModule.default;
                app.use(routePath, router);
            }
        }),
    );
};

const startServer = async () => {
    try {
        const connection = await db.getConnection();
        console.debug('Database Connected!');
        connection.release();
    } catch (error) {
        console.error('Error Connecting to Database!');
        console.error(error);
        return;
    }

    await loadRoutes();
    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(PORT, () =>
        console.log(`Server is Running at http://localhost:${PORT}`),
    );
};

startServer();
