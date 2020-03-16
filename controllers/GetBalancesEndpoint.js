const Decimal = require('decimal.js');
const Endpoint = require('./Endpoint');
const Nem2 = require('nem2-sdk');

Decimal.set({precision: 100, rounding: 8});

class GetBalancesEndpoint extends Endpoint {
	static async handleRequest(request, response) {
		console.log(['getBalances', request.body]);

		if (!super.hasValidParameter('mosaicIdentifier', request.body)) {
			response.json({status: 'failure', message: 'Missing parameters, got: ' + JSON.stringify(request.body) + '.'});

			return;
		}

		const mosaicIdentifier = new Nem2.MosaicId(request.body.mosaicIdentifier);
		const currencyIdentifier = new Nem2.MosaicId(process.env.CURRENCY_IDENTIFIER);
		const repositoryFactory = new Nem2.RepositoryFactoryHttp(process.env.NODE_URL);
		const accountRepository = repositoryFactory.createAccountRepository();

		let mosaics = await new Promise(function(resolve, reject) {
			accountRepository.getAccountInfo(Nem2.Address.createFromRawAddress(process.env.ACCOUNT_ADDRESS)).subscribe(function(result) {
				let mosaics = {
					currency: '0',
					mosaic: '0'
				};

				for (const mosaic of result.mosaics) {
					if (mosaic.id.equals(currencyIdentifier)) {
						mosaics.currency = mosaic.amount.toString()
					} else if (mosaic.id.equals(mosaicIdentifier)) {
						mosaics.mosaic = mosaic.amount.toString()
					}
				}

				resolve(mosaics);
			}, function(error) {
				resolve({});
			});
		});

		response.send({status: 'success', message: 'OK', data: mosaics});
	}
}

module.exports = GetBalancesEndpoint;
