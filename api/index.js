const serverless = require('serverless-http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const app = require('../backend/server');

module.exports = serverless(app);
