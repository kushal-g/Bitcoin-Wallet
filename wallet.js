const bjl = require("bitcoinjs-lib");
const bip32 = require("bip32");
const axios = require("axios");
const b58 = require("bs58check");
const coinselect = require("coinselect");
const bip39 = require("bip39");
const blockcypher = require("blockcypher");
const util = require("util");

class Wallet {
  constructor(network) {
    this.network = network;
    this.token = "5849c99db61a468db0ab443bab0a9a22";
  }

  address_list(xpub, chain, start, end) {
    let pubkeys = [];
    for (let index = start; index <= end; index++) {
      let address = bip32
        .fromBase58(xpub, this.network)
        .derivePath(`${chain}/${index}`);
      //Derivation path: public key/ bip / testnet / account no / change or receive / address index
      pubkeys.push(address.publicKey);
    }

    const addresses = pubkeys.map(
      (key) =>
        bjl.payments.p2pkh({ pubkey: key, network: this.network }).address
    );

    return addresses;
  }

  //this function will generate bitcoin testnet addresses using "xpub" for "chain" index = 0 or 1 from range index "start" to "end".

  add_wallet(name, addresses) {
    return new Promise((resolve, reject) => {
      const bcapi = new blockcypher("btc", "test3", this.token);
      bcapi.createWallet({ name, addresses }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  //this function will add the "addresses" list on blockcypher database. This list is recognised by the "name" argument.

  add_addresses(name, addresses) {
    return new Promise((resolve, reject) => {
      const bcapi = new blockcypher("btc", "test3", this.token);
      bcapi.addAddrWallet(name, addresses, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  //this function will add the "addresses" on blockcypher database to an already existing wallet recognised by the "name" argument.

  fetch_wallet(name) {
    return new Promise((resolve, reject) => {
      const bcapi = new blockcypher("btc", "test3", this.token);
      bcapi.getAddrsWallet(name, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.addresses);
        }
      });
    });
  }

  //this function will fetch the "addresses" from blockcypher database of an already existing wallet recognised by the "name" argument.

  fetch_utxo(receive, change) {
    return new Promise(async (resolve, reject) => {
      const bcapi = new blockcypher("btc", "test3", this.token);
      const data = {
        receive: {
          wallet_name: receive,
          addresses: [],
        },
        change: {
          wallet_name: change,
          addresses: [],
        },
      };

      const addressListReceive = await this.fetch_wallet(receive);
      for (let address of addressListReceive) {
        const UTXOs = await this.fetch_utxo_address(address);
        data.receive.addresses.push({ address, UTXOs });
      }

      const addressListChange = await this.fetch_wallet(change);
      for (let address of addressListChange) {
        const UTXOs = await this.fetch_utxo_address(address);
        data.change.addresses.push({ address, UTXOs });
      }

      resolve(data);
    });
  }
  //this function will fetch "UTXOs" using wallet name provided in "receive" and "change" argumnets using blockcypher APIs

  fetch_utxo_address(address) {
    console.log("ADDRESS: ", address);
    return new Promise((resolve, reject) => {
      const bcapi = new blockcypher("btc", "test3", this.token);
      bcapi.getAddr(address, { unspentOnly: true }, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          resolve(data.txrefs || []);
        }
      });
    });
  }

  generate_unsigned_transaction(xpub, output_address, amount) {
    return new Promise((resolve, reject) => {
      const bcapi = new blockcypher("btc", "test3", this.token);
      const addresses = this.address_list(xpub, 0, 0, 0);

      var newtx = {
        inputs: [{ addresses }],
        outputs: [{ addresses: [output_address], value: amount }],
      };

      bcapi.newTX(newtx, (err, data) => {
        if (err) {
          reject(err);
        } else {
          console.log(data);
        }
      });
    });
  }

  //this function will generate unsigned txn using "xpub" to send "amount" to "output_address"
}

let a = new Wallet(bjl.networks.testnet);

a.generate_unsigned_transaction(
  "tpubDEvMxC8sb8idnL9Xe5xGhmo9JPiaFnf3TpHDajMULTaWeh9jhoAxDJZ8oFWQU89n6MUsPKoJFmdPnZiQ1vNVemnR3TwbdDVj1TC1gpbbh6w",
  "n3AUMFmYXE9FNgXHWkXZQVkkmxfCF5kbnd",
  0.005
);
