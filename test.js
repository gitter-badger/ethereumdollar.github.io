var config = require('./config.js');
var utility = require('./common/utility.js');
var Web3 = require('web3');
var assert = require('assert');
var TestRPC = require('ethereumjs-testrpc');
var fs = require('fs');
var sha256 = require('js-sha256').sha256;
var async = require('async');
var BigNumber = require('bignumber.js');
var utils = require('web3/lib/utils/utils.js');
var coder = require('web3/lib/solidity/coder.js');
var solc = require('solc');
var request = require('request');

var logger = {
  log: function(message) {
    // console.log(message);
  }
};

function deploy(web3, sourceFile, contractName, constructorParams, address, callback) {
  utility.readFile(sourceFile+'.bytecode', function(err, bytecode){
    utility.readFile(sourceFile+'.interface', function(err, abi){
      utility.readFile(sourceFile, function(err, source){
        if (abi && bytecode) {
          abi = JSON.parse(abi);
          bytecode = JSON.parse(bytecode);
        } else if (typeof(solc)!='undefined') {
          var compiled = solc.compile(source, 1).contracts[contractName];
          abi = JSON.parse(compiled.interface);
          bytecode = compiled.bytecode;
        }
        var contract = web3.eth.contract(abi);
        utility.testSend(web3, contract, undefined, 'constructor', constructorParams.concat([{from: address, data: bytecode}]), address, undefined, 0, function(err, result) {
          var initialTransaction = result;
          assert.deepEqual(initialTransaction.length, 66);
          web3.eth.getTransactionReceipt(initialTransaction, function(err, receipt) {
            assert.equal(err, undefined);
            var addr = receipt.contractAddress;
            contract = contract.at(addr);
            assert.notEqual(receipt, null, "Transaction receipt shouldn't be null");
            assert.notEqual(addr, null, "Transaction did not create a contract");
            web3.eth.getCode(addr, function(err, result) {
              assert.equal(err, undefined);
              assert.notEqual(result, null);
              assert.notEqual(result, "0x0");
              callback(undefined, {contract: contract, addr: addr});
            });
          });
        });
      });
    });
  });
}

describe("Test", function(done) {
  this.timeout(240*1000);
  var web3 = new Web3();
  var port = 12345;
  var server;
  var accounts;
  var contractEthereumDollar;
  var contractBackerToken;
  var contractDollarToken;
  var contractOraclize;
  var contractResolver;
  var contractEthereumDollarAddr;
  var contractBackerTokenAddr;
  var contractDollarTokenAddr;
  var contractOraclizeAddr;
  var contractResolverAddr;
  var unit = new BigNumber(utility.ethToWei(1.0));
  var exchangeRate = undefined;
  var solvencyCreateDollar = undefined;
  var solvencyRedeemBacker = undefined;
  var feePercentage = undefined;
  var feeAccount = undefined;

  before("Initialize TestRPC server", function(done) {
    server = TestRPC.server(logger);
    server.listen(port, function() {
      config.ethProvider = "http://localhost:" + port;
      config.eth_gas_cost = 20000000000;
      web3.setProvider(new Web3.providers.HttpProvider("http://localhost:" + port));
      done();
    });
  });

  before("Initialize accounts", function(done) {
    web3.eth.getAccounts(function(err, accs) {
      assert.equal(err, undefined);
      accounts = accs;
      config.ethAddr = accounts[0];
      done();
    });
  });

  after("Shutdown server", function(done) {
    server.close(done);
  });

  describe("Contract scenario", function() {
    it("Should deploy Oraclize contracts", function(done) {
      utility.readFile('oraclizeConnector.sol', function(err, source){
        var cbLine = source.match(/\+?(cbAddress = 0x.*)\;/i)[0];
        source = source.replace(cbLine,'cbAddress = '+accounts[0]+';');
        utility.writeFile('oraclizeConnector_test.sol', source, function(err, result){
          deploy(web3, 'oraclizeConnector_test.sol', 'Oraclize', [], accounts[0], function(err, result) {
            contractOraclizeAddr = result.addr;
            contractOraclize = result.contract;
            deploy(web3, 'addressResolver.sol', 'OraclizeAddrResolver', [], accounts[0], function(err, result) {
              contractResolverAddr = result.addr;
              contractResolver = result.contract;
              utility.testSend(web3, contractResolver, contractResolverAddr, 'setAddr', [contractOraclizeAddr, {gas: 1000000, value: 0}], accounts[0], undefined, 0, function(err, result) {
                done();
              });
            });
          });
        });
      });
    });
    it("Should add the backer token contract to the network", function(done) {
      deploy(web3, config.contractToken, 'ReserveToken', [], accounts[0], function(err, contract) {
        contractBackerToken = contract.contract;
        contractBackerTokenAddr = contract.addr;
        done();
      });
    });
    it("Should add the dollar token contract to the network", function(done) {
      deploy(web3, config.contractToken, 'ReserveToken', [], accounts[0], function(err, contract) {
        contractDollarToken = contract.contract;
        contractDollarTokenAddr = contract.addr;
        done();
      });
    });
    it("Should add the ethereumdollar contract to the network", function(done) {
      exchangeRate = new BigNumber(utility.ethToWei(100.0));
      solvencyCreateDollar = new BigNumber(utility.ethToWei(1.3));
      solvencyRedeemBacker = new BigNumber(utility.ethToWei(1.0));
      feePercentage = new BigNumber(utility.ethToWei(0.01));
      feeAccount = accounts[0];
      utility.readFile('ethereumdollar.sol', function(err, source){
        source = source.replace('//ORACLIZE','OAR = OraclizeAddrResolverI('+contractResolverAddr+');');
        utility.writeFile('ethereumdollar_test.sol', source, function(err, result){
          deploy(web3, 'ethereumdollar_test.sol', 'EthereumDollar', [contractDollarTokenAddr, contractBackerTokenAddr, exchangeRate, solvencyCreateDollar, solvencyRedeemBacker, feePercentage, feeAccount], accounts[0], function(err, contract) {
            contractEthereumDollar = contract.contract;
            contractEthereumDollarAddr = contract.addr;
            done();
          });
        });
      });
    });
    it("Should mint some backer tokens", function(done) {
      web3.eth.getBalance(accounts[0], function(err, result) {
        var initialFeeBalance = result;
        async.reduce([1,2,3,4,5], new BigNumber(0),
          function(memo, i, callback){
            var random_amount = utility.ethToWei((Math.random()*100+100).toFixed(2));
            var amount = new BigNumber(random_amount);
            utility.testSend(web3, contractEthereumDollar, contractEthereumDollarAddr, 'createBackerTokens', [{gas: 1000000, value: amount}], accounts[i], undefined, 0, function(err, result) {
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
              utility.testCall(web3, contractBackerToken, contractBackerTokenAddr, 'totalSupply', [], function(err, result) {
                assert.equal(err, undefined);
                var totalSupply = result;
                utility.testCall(web3, contractEthereumDollar, contractEthereumDollarAddr, 'backerRate', [], function(err, result) {
                  assert.equal(err, undefined);
                  var backerRate = result;
                  web3.eth.getBalance(contractEthereumDollarAddr, function(err, result) {
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
      web3.eth.getBalance(contractEthereumDollarAddr, function(err, result) {
        var initialBalance = result;
        web3.eth.getBalance(accounts[0], function(err, result) {
          var initialFeeBalance = result;
          async.reduce([1,2,3,4,5], new BigNumber(0),
            function(memo, i, callback){
              var random_amount = utility.ethToWei((Math.random()*100+100).toFixed(2));
              var amount = new BigNumber(random_amount);
              amount = utility.ethToWei(100);
              utility.testSend(web3, contractEthereumDollar, contractEthereumDollarAddr, 'createDollarTokens', [{gas: 1000000, value: amount}], accounts[i], undefined, 0, function(err, result) {
                assert.equal(err, undefined);
                callback(null, memo.add(amount));
              });
            },
            function(err, result){
              var amountMinted = result;
              web3.eth.getBalance(accounts[0], function(err, result) {
                var finalFeeBalance = result;
                utility.testCall(web3, contractDollarToken, contractDollarTokenAddr, 'totalSupply', [], function(err, result) {
                  assert.equal(err, undefined);
                  var totalSupply = result;
                  utility.testCall(web3, contractEthereumDollar, contractEthereumDollarAddr, 'exchangeRate', [], function(err, result) {
                    assert.equal(err, undefined);
                    exchangeRate = result;
                    web3.eth.getBalance(contractEthereumDollarAddr, function(err, result) {
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
    it("Should update the exchange rate", function(done) {
      //this section modified from https://github.com/oraclize/ethereum-bridge/blob/master/nodejs/plugin.js
      var log1e = contractOraclize.Log1([], [], function(err, data){
        if (err == null){
          handleLog(data);
        }
      });
      var log2e = contractOraclize.Log2([], [], function(err, data){
        if (err == null){
          handleLog(data);
        }
      });
      function handleLog(data){
        data = data['args'];

        var myid = myIdInitial = data['cid'];
        var cAddr = data['sender'];
        var ds = data['datasource'];
        if(typeof(data['arg']) != 'undefined'){
          var formula = data['arg'];
        } else {
          var formula = [data['arg1'],JSON.parse(data['arg2'])];
        }
        var time = parseInt(data['timestamp']);
        var gasLimit = data['gaslimit'];
        var proofType = data['proofType'];
        var query = {
          when: time,
          datasource: ds,
          query: formula,
          proof_type: parseInt(proofType)
        };
        console.log(formula);
        console.log(JSON.stringify(query));
        createQuery(query, function(data){
          console.log("Query : "+JSON.stringify(data));
          myid = data.result.id;
          console.log("New query created, id: "+myid);
          console.log("Checking query status every 5 seconds..");
          var interval = setInterval(function(){
            // check query status
            checkQueryStatus(myid, function(data){ console.log("Query result: "+JSON.stringify(data));
              if(data.result.checks==null) return;
              var last_check = data.result.checks[data.result.checks.length-1];
              var query_result = last_check.results[last_check.results.length-1];
              var dataRes = query_result;
              var dataProof = data.result.checks[data.result.checks.length-1]['proofs'][0];
              if (dataRes==null || (dataProof==null && proofType!='0x00')) return;
              else clearInterval(interval);
              queryComplete(gasLimit, myIdInitial, dataRes, dataProof, cAddr);
            });
          }, 5*1000);
        });
      }
      function createQuery(query, callback){
        request.post('https://api.oraclize.it/api/v1/query/create', {body: query, json: true}, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            callback(body);
          }
        });
      }

      function checkQueryStatus(query_id, callback){
        request.get('https://api.oraclize.it/api/v1/query/'+query_id+'/status', {json: true}, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            callback(body);
          }
        });
      }
      function queryComplete(gasLimit, myid, result, proof, contractAddr){
        var callbackDefinition = [{"constant":false,"inputs":[{"name":"myid","type":"bytes32"},{"name":"result","type":"string"},{"name":"proof","type":"bytes"}],"name":"__callback","outputs":[],"type":"function"},{"inputs":[],"type":"constructor"}];
        web3.eth.contract(callbackDefinition).at(contractAddr).__callback(myid,result,proof,{from:accounts[0],gas:gasLimit,value:0}, function(err, contract){
          if(err){
            console.log(err);
          } else {
            console.log('proof: '+proof);
            console.log('myid: '+myid);
            console.log('result: '+result);
            console.log('Contract '+contractAddr+ ' __callback called');
            done();
          }
        });
      }
      utility.testSend(web3, contractEthereumDollar, contractEthereumDollarAddr, 'updateExchangeRate', [{gas: 1000000, value: utility.ethToWei(0.02)}], accounts[0], undefined, 0, function(err, result) {
      });
    });
    it("Should check for savior mode", function(done) {
      utility.testCall(web3, contractEthereumDollar, contractEthereumDollarAddr, 'exchangeRate', [], function(err, result) {
        exchangeRate = result;
        utility.testCall(web3, contractEthereumDollar, contractEthereumDollarAddr, 'solvency', [0,0,0], function(err, result) {
          var solvency = result;
          assert.equal(solvency.lt(unit), true);
          var amountMinted = new BigNumber(utility.ethToWei(1000));
          utility.testCall(web3, contractDollarToken, contractDollarTokenAddr, 'totalSupply', [], function(err, result) {
            var totalDollarSupplyBefore = result;
            utility.testSend(web3, contractEthereumDollar, contractEthereumDollarAddr, 'createBackerTokens', [{gas: 1000000, value: amountMinted}], accounts[0], undefined, 0, function(err, result) {
              utility.testCall(web3, contractBackerToken, contractBackerTokenAddr, 'totalSupply', [], function(err, result) {
                var totalSupply = result;
                utility.testCall(web3, contractDollarToken, contractDollarTokenAddr, 'totalSupply', [], function(err, result) {
                  var totalDollarSupplyAfter = result;
                  var backerRate = unit;
                  assert.equal(!totalSupply.equals(amountMinted.times(unit.sub(feePercentage)).div(backerRate)), false);
                  assert.equal(!totalDollarSupplyAfter.minus(totalDollarSupplyBefore).equals(amountMinted.times(exchangeRate).times(unit.sub(feePercentage)).div(unit).div(unit)), false);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});
