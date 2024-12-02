import express from 'express';

import fs from 'fs';
import path from 'path';

import { db } from './database';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, '../dist/public')));
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

fs.readdirSync(path.resolve(__dirname, 'routes')).forEach(async (file) => {
    if (file.endsWith('.route.js') || file.endsWith('.route.ts')) {
        const routeModule = await import(`./routes/${file}`);
        const { router, path: routePath } = routeModule.default;
        app.use(routePath, router);
    }
});

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

    app.listen(PORT, () =>
        console.log(`Server is Running at http://localhost:${PORT}`),
    );
};

startServer();
