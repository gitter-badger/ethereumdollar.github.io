var config = require('./config.js');
var utility = require('./utility.js');
var Web3 = require('web3');
var assert = require('assert');
var TestRPC = require('ethereumjs-testrpc');
var fs = require('fs');
var sha256 = require('js-sha256').sha256;
var async = require('async');
var BigNumber = require('bignumber.js');
var utils = require('web3/lib/utils/utils.js');
var coder = require('web3/lib/solidity/coder.js');

var logger = {
  log: function(message) {
    // console.log(message);
  }
};

describe("Test", function(done) {
  this.timeout(240*1000);
  var web3 = new Web3();
  var port = 12345;
  var server;
  var accounts;
  var myContract_ethereumdollar;
  var myContract_backertoken;
  var myContract_dollartoken;
  var contract_ethereumdollar_addr;
  var contract_backertoken_addr;
  var contract_dollartoken_addr;
  var unit = new BigNumber(utility.ethToWei(1.0));
  var exchangeRate = undefined;
  var solvencyCreateDollar = undefined;
  var solvencyRedeemBacker = undefined;
  var feePercentage = undefined;
  var feeAccount = undefined;

  before("Initialize TestRPC server", function(done) {
    server = TestRPC.server(logger);
    server.listen(port, function() {
      config.eth_provider = "http://localhost:" + port;
      config.eth_gas_cost = 20000000000;
      web3.setProvider(new Web3.providers.HttpProvider("http://localhost:" + port));
      done();
    });
  });

  before("Initialize accounts", function(done) {
    web3.eth.getAccounts(function(err, accs) {
      assert.equal(err, undefined);
      accounts = accs;
      config.eth_addr = accounts[0];
      done();
    });
  });

  after("Shutdown server", function(done) {
    server.close(done);
  });

  describe("Contract scenario", function() {
      it("Should add the backer token contract to the network", function(done) {
        utility.readFile(config.contract_token+'.bytecode', function(bytecode){
          utility.readFile(config.contract_token+'.interface', function(abi){
            abi = JSON.parse(abi);
            bytecode = JSON.parse(bytecode);
            myContract_backertoken = web3.eth.contract(abi);
            utility.testSend(web3, myContract_backertoken, undefined, 'constructor', [{from: accounts[0], data: bytecode}], accounts[0], undefined, 0, function(err, result) {
              assert.equal(err, undefined);
              //You are probably getting this error because ethereumjs-testrpc's block gas limit is too small (it hasn't been upgraded to the homestead block limit). Change line 95 of node_modules/ethereumjs-testrpc/lib/blockchain.js to block.header.gasLimit = '0x47e7c4';
              var initialTransaction = result;
              assert.deepEqual(initialTransaction.length, 66);
              web3.eth.getTransactionReceipt(initialTransaction, function(err, receipt) {
                assert.equal(err, undefined);
                contract_backertoken_addr = receipt.contractAddress;
                myContract_backertoken = myContract_backertoken.at(contract_backertoken_addr);
                assert.notEqual(receipt, null, "Transaction receipt shouldn't be null");
                assert.notEqual(contract_backertoken_addr, null, "Transaction did not create a contract");
                web3.eth.getCode(contract_backertoken_addr, function(err, result) {
                  assert.equal(err, undefined);
                  assert.notEqual(result, null);
                  assert.notEqual(result, "0x0");
                  done();
                });
              });
            });
          });
        });
      });
      it("Should add the dollar token contract to the network", function(done) {
        utility.readFile(config.contract_token+'.bytecode', function(bytecode){
          utility.readFile(config.contract_token+'.interface', function(abi){
            abi = JSON.parse(abi);
            bytecode = JSON.parse(bytecode);
            myContract_dollartoken = web3.eth.contract(abi);
            utility.testSend(web3, myContract_dollartoken, undefined, 'constructor', [{from: accounts[0], data: bytecode}], accounts[0], undefined, 0, function(err, result) {
              assert.equal(err, undefined);
              var initialTransaction = result;
              assert.deepEqual(initialTransaction.length, 66);
              web3.eth.getTransactionReceipt(initialTransaction, function(err, receipt) {
                assert.equal(err, undefined);
                contract_dollartoken_addr = receipt.contractAddress;
                myContract_dollartoken = myContract_dollartoken.at(contract_dollartoken_addr);
                assert.notEqual(receipt, null, "Transaction receipt shouldn't be null");
                assert.notEqual(contract_dollartoken_addr, null, "Transaction did not create a contract");
                web3.eth.getCode(contract_dollartoken_addr, function(err, result) {
                  assert.equal(err, undefined);
                  assert.notEqual(result, null);
                  assert.notEqual(result, "0x0");
                  done();
                });
              });
            });
          });
        });
      });
      it("Should add the ethereumdollar contract to the network", function(done) {
        //constructor: address dollarToken_, address backerToken_, uint exchangeRate_, uint solvencyCreateDollar_, uint solvencyRedeemBacker_, uint feePercentage_, address feeAccount_
        exchangeRate = new BigNumber(utility.ethToWei(10.0));
        solvencyCreateDollar = new BigNumber(utility.ethToWei(1.3));
        solvencyRedeemBacker = new BigNumber(utility.ethToWei(1.0));
        feePercentage = new BigNumber(utility.ethToWei(0.01));
        feeAccount = accounts[0];
        utility.readFile(config.contract_ethereumdollar+'.bytecode', function(bytecode){
          utility.readFile(config.contract_ethereumdollar+'.interface', function(abi){
            abi = JSON.parse(abi);
            bytecode = JSON.parse(bytecode);
            myContract_ethereumdollar = web3.eth.contract(abi);
            utility.testSend(web3, myContract_ethereumdollar, undefined, 'constructor', [contract_dollartoken_addr, contract_backertoken_addr, exchangeRate, solvencyCreateDollar, solvencyRedeemBacker, feePercentage, feeAccount, {from: accounts[0], data: bytecode}], accounts[0], undefined, 0, function(err, result) {
              assert.equal(err, undefined);
              var initialTransaction = result;
              assert.deepEqual(initialTransaction.length, 66);
              web3.eth.getTransactionReceipt(initialTransaction, function(err, receipt) {
                assert.equal(err, undefined);
                contract_ethereumdollar_addr = receipt.contractAddress;
                myContract_ethereumdollar = myContract_ethereumdollar.at(contract_ethereumdollar_addr);
                assert.notEqual(receipt, null, "Transaction receipt shouldn't be null");
                assert.notEqual(contract_ethereumdollar_addr, null, "Transaction did not create a contract");
                web3.eth.getCode(contract_ethereumdollar_addr, function(err, result) {
                  assert.equal(err, undefined);
                  assert.notEqual(result, null);
                  assert.notEqual(result, "0x0");
                  done();
                });
              });
            });
          });
        });
      });
      it("Should mint some backer tokens", function(done) {
        web3.eth.getBalance(accounts[0], function(err, result) {
          var initialFeeBalance = result;
          async.reduce([1,2,3,4,5], new BigNumber(0),
            function(memo, i, callback){
              var random_amount = utility.ethToWei(utility.roundTo(Math.random()*100+100,2));
              var amount = new BigNumber(random_amount);
              utility.testSend(web3, myContract_ethereumdollar, contract_ethereumdollar_addr, 'createBackerTokens', [{gas: 1000000, value: amount}], accounts[i], undefined, 0, function(err, result) {
                assert.equal(err, undefined);
                callback(null, memo.add(amount));
              });
            },
            function(err, result){
              assert.equal(err, undefined);
              var amountMinted = result;
              web3.eth.getBalance(accounts[0], function(err, result) {
                assert.equal(err, undefined);
                var finalFeeBalance = result;
                utility.testCall(web3, myContract_backertoken, contract_backertoken_addr, 'totalSupply', [], function(err, result) {
                  assert.equal(err, undefined);
                  var totalSupply = result;
                  utility.testCall(web3, myContract_ethereumdollar, contract_ethereumdollar_addr, 'backerRate', [], function(err, result) {
                    assert.equal(err, undefined);
                    var backerRate = result;
                    web3.eth.getBalance(contract_ethereumdollar_addr, function(err, result) {
                      assert.equal(err, undefined);
                      var balance = result;
                      assert.equal(!totalSupply.equals(amountMinted.times(unit.sub(feePercentage)).div(backerRate)), false);
                      assert.equal(!finalFeeBalance.sub(initialFeeBalance).equals(amountMinted.times(feePercentage).div(unit)), false);
                      assert.equal(!balance.equals(amountMinted.times(unit.sub(feePercentage)).div(unit)), false);
                      done();
                    });
                  });
                });
              });
            }
          );
        });
      });
      it("Should mint some dollar tokens", function(done) {
        web3.eth.getBalance(contract_ethereumdollar_addr, function(err, result) {
          var initialBalance = result;
          web3.eth.getBalance(accounts[0], function(err, result) {
            var initialFeeBalance = result;
            async.reduce([1,2,3,4,5], new BigNumber(0),
              function(memo, i, callback){
                var random_amount = utility.ethToWei(utility.roundTo(Math.random()*100,2));
                var amount = new BigNumber(random_amount);
                amount = utility.ethToWei(100);
                utility.testSend(web3, myContract_ethereumdollar, contract_ethereumdollar_addr, 'createDollarTokens', [{gas: 1000000, value: amount}], accounts[i], undefined, 0, function(err, result) {
                  assert.equal(err, undefined);
                  callback(null, memo.add(amount));
                });
              },
              function(err, result){
                var amountMinted = result;
                web3.eth.getBalance(accounts[0], function(err, result) {
                  var finalFeeBalance = result;
                  utility.testCall(web3, myContract_dollartoken, contract_dollartoken_addr, 'totalSupply', [], function(err, result) {
                    assert.equal(err, undefined);
                    var totalSupply = result;
                    utility.testCall(web3, myContract_ethereumdollar, contract_ethereumdollar_addr, 'exchangeRate', [], function(err, result) {
                      assert.equal(err, undefined);
                      exchangeRate = result;
                      web3.eth.getBalance(contract_ethereumdollar_addr, function(err, result) {
                        assert.equal(err, undefined);
                        var balance = result;
                        assert.equal(!totalSupply.equals(amountMinted.times(exchangeRate).times(unit.sub(feePercentage)).div(unit).div(unit)), false);
                        assert.equal(!finalFeeBalance.sub(initialFeeBalance).equals(amountMinted.times(feePercentage).div(unit)), false);
                        assert.equal(!balance.sub(initialBalance).equals(amountMinted.times(unit.sub(feePercentage)).div(unit)), false);
                        done();
                      });
                    });
                  });
                });
              }
            );
          });
        });
      });
    });
});
