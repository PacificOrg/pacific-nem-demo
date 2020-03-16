const Decimal = require('decimal.js');

Decimal.set({precision: 100, rounding: 8});

const MOSAIC_TRANSFER_SIZE = 177;

class PacificNem
{
	/**
	 * Constructor.
	 * @param {NemAccount} account - Instance of NemAccount.
	 * @param {NemDatabase} database - Instance of NemDatabase.
	 * @param {string} currencyIdentifier - Identifier of the currency.
	 * @param {string} mosaicIdentifier - Identifier of the mosaic.
	**/
	constructor(account, database, currencyIdentifier, mosaicIdentifier) {
		this.account = account;
		this.database = database;
		this.currencyIdentifier = currencyIdentifier;
		this.mosaicIdentifier = mosaicIdentifier;
		this.holdersSnapshot = null;
	}

	/**
	 * Splits list of the holders into batches (up to 1000 each).
	 * @param {array} holders - List of the holders.
	 * @return List of the batches.
	**/
	createBatches(holders) {
		let batches = [];

		for (let i = 0; i < holders.length; ++i) {
			if ((i % 1000) == 0) {
				batches.push([]);
			}

			batches[batches.length - 1].push(holders[i]);
		}

		return batches;
	}

	/**
	 * Retrievies and stores list of the applicable holders.
	 * @param {integer} minimumAmount - Minimum amount of tokens for applicable holders.
	 * @param {string[]} ignoredHolders - List of addresses of ignored holders.
	 * @return List of the applicable holders (sorted from highest to lowest balance) on success (HolderBalance[]), null otherwise.
	**/
	async createHoldersSnapshot(minimumAmount, ignoredHolders) {
		ignoredHolders.push(this.account.account.address.pretty());

		this.holdersSnapshot = this.database.getHolders(this.mosaicIdentifier, minimumAmount, ignoredHolders);

		return this.holdersSnapshot;
	}

	/**
	 * Sends out given mosaic to the applicable holders (from the snapshot).
	 * @param {string} mosaicIdentifier - Identifier of the mosaic.
	 * @param {integer} amount - Amount of mosaic to split.
	 * @param {boolean} checkCost - Take into account cost of the transfer if true.
	 * @return List of transfer reports on success (BatchSendStatus[]), null otherwise.
	**/
	async sendMosaic(mosaicIdentifier, amount, checkCost) {
		if (amount <= 0 || this.holdersSnapshot == null) {
			return null;
		}

		const batches = this.createBatches(this.holdersSnapshot);
		let reports = [];
		const feeMultiplier = await this.database.getFeeMultiplier();
		const fee = (checkCost ? feeMultiplier.times(MOSAIC_TRANSFER_SIZE) : new Decimal(0));
		let hasFinished = false;

		for (let i = 0; i < batches.length; ++i) {
			if (hasFinished) {
				break;
			}

			let batch = batches[i];
			let beneficiaries = [];

			for (let j = 0; j < batch.length; ++j) {
				const amount = batch[j].share.times(new Decimal(amount)).floor();

				if (value.greaterThan(fee)) {
					beneficiaries.push({
						address: batch[j].address,
						amount: amount.minus(fee)
					});
				} else {
					hasFinished = true;

					break;
				}
			}

			if (beneficiaries.length > 0) {
				const result = await this.account.sendMosaic(mosaicIdentifier, beneficiaries, feeMultiplier);

				reports.push({
					holders: beneficiaries,
					transaction: result,
					isSuccess: (result !== null)
				});
			}
		}

		return reports;
	}

	/**
	 * Sends out dividend to the applicable holders (from the snapshot).
	 * @param {integer} amount - Absolute amount of mosaic to split.
	 * @return List of transfer reports on success (BatchSendReport[]), null otherwise.
	**/
	async sendDividend(amount) {
		return await this.sendMosaic(this.currencyIdentifier, amount, true);
	}

	/**
	 * Sends out staking to the applicable holders (from the snapshot).
	 * @param {integer} amount - Absolute amount of mosaic to split.
	 * @return List of transfer reports on success (BatchSendStatus[]), null otherwise.
	**/
	async sendStaking(amount) {
		return await this.sendMosaic(this.mosaicIdentifier, amount, false);
	}
}

module.exports = PacificNem;
