const Decimal = require('decimal.js');
const Endpoint = require('./Endpoint');
const NemAccount = require('../lib/NemAccount');
const NemDatabase = require('../lib/NemDatabase');
const parseCsv = require('csv-parse/lib/sync');

Decimal.set({precision: 100, rounding: 8});

class SendMosaicEndpoint extends Endpoint {
	static async handleRequest(request, response) {
		console.log(['sendMosaic', request.body]);

		if (!super.hasValidParameter('mosaicIdentifier', request.body) || !super.hasValidParameter('beneficiaries', request.body)) {
			response.json({status: 'failure', message: 'Missing parameters, got: ' + JSON.stringify(request.body) + '.'});

			return;
		}

		let beneficiaries = [];
		let total = new Decimal(0);
		const records = parseCsv(request.body.beneficiaries, {delimiter: ',', skip_empty_lines: true});

		for (let i = 0; i < records.length; ++i) {
			if (records[i].length == 2) {
				const amount = new Decimal(records[i][1].trim()).times(1000000).round();
				const address = records[i][0].trim();

				if (amount.greaterThan(0)) {
					beneficiaries.push({address: address, amount: amount.toString()})

					total = total.plus(amount);
				}
			}

			if (beneficiaries.length > 999) {
				break;
			}
		}

		if (beneficiaries.length == 0) {
			response.json({status: 'failure', message: 'Beneficiaries list is empty.'});

			return;
		}

		let account = new NemAccount(process.env.NODE_URL, process.env.GENERATION_HASH, process.env.NETWORK_TYPE, process.env.ACCOUNT_KEY);
		let database = new NemDatabase(process.env.DATABASE_URL, process.env.DATABASE_NAME);
		const result = await account.sendMosaic(request.body.mosaicIdentifier, beneficiaries, await database.getFeeMultiplier());

		if (result !== null) {
			response.json({status: 'success', message: 'OK'});

			return;
		}

		response.json({status: 'failure', message: 'Failed to send tokens.'});
	}
}

module.exports = SendMosaicEndpoint;
