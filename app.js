const Express = require('express');
const CreateMosaicEndpoint = require('./controllers/CreateMosaicEndpoint');
const GetBalancesEndpoint = require('./controllers/GetBalancesEndpoint');
const GetHoldersEndpoint = require('./controllers/GetHoldersEndpoint');
const SendDividendEndpoint = require('./controllers/SendDividendEndpoint');
const SendMosaicEndpoint = require('./controllers/SendMosaicEndpoint');
const SendStakingEndpoint = require('./controllers/SendStakingEndpoint');

require('dotenv').config();

const app = Express();
app.use(Express.json());
app.use(Express.urlencoded({extended: true}));
app.post('/api/createMosaic', CreateMosaicEndpoint.handleRequest);
app.post('/api/getBalances', GetBalancesEndpoint.handleRequest);
app.post('/api/getHolders', GetHoldersEndpoint.handleRequest);
app.post('/api/sendDividend', SendDividendEndpoint.handleRequest);
app.post('/api/sendMosaic', SendMosaicEndpoint.handleRequest);
app.post('/api/sendStaking', SendStakingEndpoint.handleRequest);
app.listen(parseInt(process.env.APPLICATION_PORT));
