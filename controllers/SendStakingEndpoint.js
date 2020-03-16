const Decimal = require('decimal.js');
const Endpoint = require('./Endpoint');
const NemAccount = require('../lib/NemAccount');
const NemDatabase = require('../lib/NemDatabase');
const PacificNem = require('../lib/PacificNem');

Decimal.set({precision: 100, rounding: 8});

class SendStakingEndpoint extends Endpoint {
	static async handleRequest(request, response) {
		console.log(['sendStaking', request.body]);

		if (!super.hasValidParameter('mosaicIdentifier', request.body) || !super.hasValidParameter('staking', request.body)) {
			response.json({status: 'failure', message: 'Missing parameters, got: ' + JSON.stringify(request.body) + '.'});

			return;
		}

		let account = new NemAccount(process.env.NODE_URL, process.env.GENERATION_HASH, process.env.NETWORK_TYPE, process.env.ACCOUNT_KEY);
		let database = new NemDatabase(process.env.DATABASE_URL, process.env.DATABASE_NAME);
		let pacific = new PacificNem(account, database, process.env.CURRENCY_IDENTIFIER, request.body.mosaicIdentifier);
		let holdersSnapshot = await pacific.createHoldersSnapshot(process.env.MINIMUM_SHARE, (request.body.ignoredHolders ? request.body.ignoredHolders.split(',') : []));

		if (holdersSnapshot == null) {
			response.json({status: 'failure', message: 'Failed to retrieve holders snapshot.'});

			return;
		}

		if (holdersSnapshot.length == 0) {
			response.json({status: 'failure', message: 'No applicable holders found.'});

			return;
		}

		const result = await pacific.sendStaking(request.body.staking);

		if (result !== null) {
			response.json({status: 'success', message: 'OK'});

			return;
		}

		response.json({status: 'failure', message: 'Failed to send staking.'});
	}
}

module.exports = SendStakingEndpoint;
