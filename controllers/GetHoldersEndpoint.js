const Endpoint = require('./Endpoint');
const NemDatabase = require('../lib/NemDatabase');

class GetHoldersEndpoint extends Endpoint {
	static async handleRequest(request, response) {
		console.log(['getHolders', request.body]);

		if (!super.hasValidParameter('mosaicIdentifier', request.body)) {
			response.json({status: 'failure', message: 'Missing parameters, got: ' + JSON.stringify(request.body) + '.'});

			return;
		}

		let database = new NemDatabase(process.env.DATABASE_URL, process.env.DATABASE_NAME);
		const holders = database.getHolders(request.body.mosaicIdentifier, process.env.MINIMUM_SHARE, []);

		if (!holders) {
			if (holders == null) {
				response.json({status: 'failure', message: 'Failed to retrieve holders list.'});
			} else {
				response.json({status: 'failure', message: 'Empty holders list.'});
			}

			return;
		}

		response.json({status: 'success', message: 'OK', data: holders});
	}
}

module.exports = GetHoldersEndpoint;
