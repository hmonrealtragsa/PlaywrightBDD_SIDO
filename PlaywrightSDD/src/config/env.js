const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  SIDO2_BASE_URL: process.env.SIDO2_BASE_URL || 'https://sido2prepro.tragsa.es/',
  SIDO2_USERNAME: process.env.SIDO2_USERNAME || 'hmonreal',
  SIDO2_PASSWORD: process.env.SIDO2_PASSWORD || 'test',
};
