const {resolve} = require('path');
const express = require('express');
const Router = express.Router;

const host = 'localhost';
const port = 8000;
const app = express();
const webServer = Router();
const wwwDir = resolve(__dirname, '../www');
const webIndex = resolve(wwwDir, './index.html');

express.static.mime.define({
    'application/javascript': ['js'],
    'application/json': ['json'],
    'image/vnd.microsoft.icon': ['ico'],
    'image/png': ['png'],
    'image/svg+xml': ['svg'],
    'text/css': ['css'],
    'text/html': ['html'],
});

webServer.get('/', (_, res) => res.sendFile(webIndex));

webServer.use('/auth', express.static(resolve(wwwDir, './auth')));

webServer.get('/bundle.css', async (_, res) => res.sendFile(resolve(wwwDir, `./bundle.css`)));
webServer.get('/:id.js', async (req, res) =>
    res.sendFile(resolve(wwwDir, `./${req.params.id}.js`))
);
webServer.get('/lib/:id.js', async (req, res) =>
    res.sendFile(resolve(wwwDir, `./lib/${req.params.id}.js`))
);

app.use('/', webServer);
app.get('*', (_, res) => res.redirect('/'));

app.listen(port, host, () => {
    const timestamp = new Date().toLocaleString();
    console.info(`Serving from: http://${host}:${port}`);
    console.info(`Using files from: ${wwwDir}`);
    console.info(`Server started at: ${timestamp}`);
});
