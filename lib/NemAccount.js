const Decimal = require('decimal.js');
const Nem2 = require('nem2-sdk');

Decimal.set({precision: 100, rounding: 8});

const FEE_MULTIPLIER = 1.2;
const MOSAIC_CREATION_SIZE = 312;
const MOSAIC_TRANSFER_SIZE = 177;

class NemAccount
{
	/**
	 * Constructor.
	 * @param {string} nodeUrl - NEM node URL.
	 * @param {string} generationHash - Generation hash.
	 * @param {string} networkType - Network type (testnet or mainnet).
	 * @param {string} accountKey - Private key of the account.
	**/
	constructor(nodeUrl, generationHash, networkType, accountKey) {
		this.nodeUrl = nodeUrl;
		this.generationHash = generationHash;
		this.networkType = ((networkType == 'mainnet') ? Nem2.NetworkType.MAIN_NET : Nem2.NetworkType.TEST_NET);
		this.account = Nem2.Account.createFromPrivateKey(accountKey, this.networkType);
	}

	/**
	 * Calculates suggested max fee for transaction.
	 * @param {integer} size - Transaction size.
	 * @param {double} feeMultiplier - Fee multiplier.
	 * @return Suggsted max fee.
	**/
	calculateMaxFee(size, feeMultiplier) {
		return new Decimal(size).times(new Decimal(feeMultiplier)).times(new Decimal(FEE_MULTIPLIER)).ceil().toNumber();
	}

	/**
	 * Signs and sends transaction.
	 * @param {object} transaction - Transaction to sign and send.
	 * @return Transaction hash on success, null otherwise.
	**/
	async sendTransaction(transaction) {
		const signedTransaction = this.account.sign(transaction, this.generationHash);
		const repositoryFactory = new Nem2.RepositoryFactoryHttp(this.nodeUrl);
		const transactionRepository = repositoryFactory.createTransactionRepository();
		transactionRepository.announce(signedTransaction);

		return await new Promise(function(resolve, reject) {
			let tries = 0;
			let interval = setInterval(function() {
				if (tries == 25) {
					clearInterval(interval);
					console.log('timeout');
					resolve(null);

					return;
				}

				++tries;

				transactionRepository.getTransactionStatus(signedTransaction.hash).subscribe({
					next(result) {
						clearInterval(interval);
						console.log(result.code);

						if (result.group == 'confirmed') {
							resolve(signedTransaction.hash);
						} else {
							resolve(null);
						}
					},
					error() {
					}
				});
			}, 2500);
		});
	}

	/**
	 * Creates new mosaic using predefined pamateres.
	 * @param {double} feeMultiplier - Fee multiplier.
	 * @return Address of new mosaic on success, null otherwise.
	**/
	async createMosaic(feeMultiplier) {
		const nonce = Nem2.MosaicNonce.createRandom();
		const mosaicIdentifier = Nem2.MosaicId.createFromNonce(nonce, this.account.publicAccount);
		const result = await this.sendTransaction(Nem2.AggregateTransaction.createComplete(Nem2.Deadline.create(), [
			Nem2.MosaicDefinitionTransaction.create(Nem2.Deadline.create(), nonce, mosaicIdentifier, Nem2.MosaicFlags.create(false, true, false), 6, Nem2.UInt64.fromUint(0), this.networkType).toAggregate(this.account.publicAccount),
			Nem2.MosaicSupplyChangeTransaction.create(Nem2.Deadline.create(), mosaicIdentifier, Nem2.MosaicSupplyChangeAction.Increase, Nem2.UInt64.fromUint(1000000000000000), this.networkType).toAggregate(this.account.publicAccount)
		], this.networkType, [], Nem2.UInt64.fromUint(this.calculateMaxFee(MOSAIC_CREATION_SIZE, feeMultiplier))));

		return ((result == null) ? null : mosaicIdentifier.id.toString());
	}

	/**
	 * Sends given mosaic to beneficiaries (up to 1000).
	 * @param {HolderBalance[]} beneficiaries - List of the beneficiaries.
	 * @param {double} feeMultiplier - Fee multiplier.
	 * @return Transaction hash on success, null otherwise.
	**/
	async sendMosaic(mosaicIdentifier, beneficiaries, feeMultiplier) {
		const message = Nem2.PlainMessage.create('');
		let transactions = [];

		for (let i = 0; i < beneficiaries.length; ++i)
		{
			transactions.push(Nem2.TransferTransaction.create(Nem2.Deadline.create(), Nem2.Address.createFromRawAddress(beneficiaries[i].address), [new Nem2.Mosaic(new Nem2.MosaicId(mosaicIdentifier), Nem2.UInt64.fromUint(beneficiaries[i].amount))], message, this.networkType).toAggregate(this.account.publicAccount));
		}

		return await this.sendTransaction(Nem2.AggregateTransaction.createComplete(Nem2.Deadline.create(), transactions, this.networkType, [], Nem2.UInt64.fromUint(this.calculateMaxFee((MOSAIC_TRANSFER_SIZE * beneficiaries.length), feeMultiplier))));
	}
}

module.exports = NemAccount;
