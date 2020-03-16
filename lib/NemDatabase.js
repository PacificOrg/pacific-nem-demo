const Decimal = require('decimal.js');
const MongoClient = require('mongodb').MongoClient;
const Long = require('mongodb').Long;
const Nem2 = require('nem2-sdk');

Decimal.set({precision: 100, rounding: 8});

class NemDatabase
{
	/**
	 * Constructor.
	 * @param {string} url - Database URL.
	 * @param {string} name - Database name.
	**/
	constructor(url, name) {
		this.database = null;
		this.name = name;
		this.url = url;
	}

	/**
	 * Connects to the database.
	 * @return True on success, false otherwise.
	**/
	async connect() {
		if (this.database !== null) {
			return true;
		}

		let client = await MongoClient.connect(this.url, {useNewUrlParser: true, useUnifiedTopology: true});

		if (client) {
			this.database = client.db(this.name);
		}

		return (this.database !== null);
	}

	/**
	 * Retrievies recommended fee multiplier.
	 * @return Recommended fee multiplier on success, fallback value otherwise.
	**/
	async getFeeMultiplier() {
		if (await this.connect()) {
			const values = (await this.database.collection('blocks').find().sort({'block.height': -1}).limit(3).project({'block.feeMultiplier': 1}).toArray()).map(function(block) {
				return block.block.feeMultiplier;
			});
			const sum = values.reduce(function(a, b) {
				return (a + b);
			});

			if (sum > 0) {
				return new Decimal(sum).dividedBy(values.length);
			}
		}

		return new Decimal(1);
	}

	/**
	 * Retrievies list of the applicable holders.
	 * @param {string} mosaicIdentifier - Identifier of the mosaic.
	 * @param {integer} minimumBalance - Minimum balance.
	 * @param {string[]} ignoredHolders - List of addresses of ignored holders.
	 * @return List of the applicable holders (sorted from highest to lowest balance) on success (HolderBalance[]), null otherwise.
	**/
	async getHolders(mosaicIdentifier, minimumAmount, ignoredHolders) {
		if (!(await this.connect())) {
			return null;
		}

		let balancesSum = new Decimal(0);
		const mosaicIdentifierLong = Long.fromString(mosaicIdentifier);
		const addressFromBinary = function(binary) {
			return Nem2.Address.createFromRawAddress(Nem2.RawAddress.addressToString(new Uint8Array(binary.read(0, 25)))).pretty();
		}
		let holders = (await this.database.collection('accounts').find({'account.mosaics': {$elemMatch: {'id': mosaicIdentifierLong, 'amount': {$gt: Long.fromNumber(minimumAmount)}}}}, {'account.address': 1, 'account.mosaics.amount': 1, _id: 0}).sort({'account.mosaics.amount': -1}).toArray()).filter(function(account) {
			return (ignoredHolders.indexOf(addressFromBinary(account.account.address)) < 0);
		}).map(function(account) {
			const address = addressFromBinary(account.account.address);
			const mosaics = account.account.mosaics;

			for (let i = 0; i < mosaics.length; ++i) {
				if (mosaics[i].id.equals(mosaicIdentifierLong)) {
					const balance = new Decimal(mosaics[i].amount);

					balancesSum = balancesSum.plus(balance);

					return {
						address: address,
						balance: balance
					};
				}
			}

			return {
				address: address,
				balance: new Decimal(-1)
			};
		});

		holders.map(function(holder) {
			holder.share = holder.balance.dividedBy(balancesSum);

			return holder;
		}).sort(function(a, b) {
			if (a.share.equals(b.share)) {
				return 0;
			}

			if (a.share.greaterThan(b.share)) {
				return -1;
			}

			return 1;
		});

		return holders;
	}
}

module.exports = NemDatabase;
