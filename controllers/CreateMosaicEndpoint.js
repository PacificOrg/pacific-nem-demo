const Endpoint = require('./Endpoint');
const NemAccount = require('../lib/NemAccount');
const NemDatabase = require('../lib/NemDatabase');

class CreateMosaicEndpoint extends Endpoint {
	static async handleRequest(request, response) {
		console.log(['createToken', request.body]);

		let account = new NemAccount(process.env.NODE_URL, process.env.GENERATION_HASH, process.env.NETWORK_TYPE, process.env.ACCOUNT_KEY);
		let database = new NemDatabase(process.env.DATABASE_URL, process.env.DATABASE_NAME);
		const result = await account.createMosaic(await database.getFeeMultiplier());

		if (result) {
			response.json({status: 'success', message: 'OK', data: {
				mosaicIdentifier: result
			}});

			return;
		}

		response.json({status: 'failure', message: 'Failed to create mosaic.'});
	}
}

module.exports = CreateMosaicEndpoint;
