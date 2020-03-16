# Pacific.org's demo for NEM Symbol

This repository hosts the proof of concept implementation source code of a library for handling, creation and sending mosaics on the NEM Symbol network.
Please note that this library is still under development.

## Development

Requirements:

 * [Node.js](https://nodejs.org/en/) (12.0.0 or newer)
 * [MongoDB](https://www.mongodb.com/)
 * [git](https://git-scm.com/download/)

Setup:

 1. install requirements
 2. clone the repository: `git clone https://github.com/PacificOrg/pacific-nem-demo`
 3. change into the root directory: `cd pacific-nem-demo`
 4. install all Node.js requirements from package.json: `npm install`
 5. copy env.example as .env and adjust values: `cp env.example .env`

# Configuration

Available keys:

 * `NODE_URL` - URL of NEM node;
 * `GENERATION_HASH` - network generation hash;
 * `NETWORK_TYPE` - network type (testnet or mainnet);
 * `DATABASE_URL` - connection URL for MongoDB instance of API node;
 * `DATABASE_NAME` - database name;
 * `ACCOUNT_ADDRESS` - public address of account;
 * `ACCOUNT_KEY` - private key of the account;
 * `MOSAIC_IDENTIFIER` - identifier of the mosaic (hex format);
 * `CURRENCY_IDENTIFIER` - identifier of the currency (hex format);
 * `IGNORED_HOLDERS` - comma separated list of ignored addresses;
 * `MINIMUM_SHARE` - minimum amount of mosaic to be hold (absolute value);
 * `APPLICATION_PORT` - port used by demo.
