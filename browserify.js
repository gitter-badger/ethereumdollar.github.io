var Web3 = require('web3');
var utility = require('./common/utility.js');
var request = require('request');
var sha256 = require('js-sha256').sha256;
require('datejs');
var async = (typeof(window) === 'undefined') ? require('async') : require('async/dist/async.min.js');

function Main() {
}
Main.alertInfo = function(message) {
  $('#notifications').prepend($('<p>' + message + '</p>').hide().fadeIn(2000));
  console.log(message);
}
Main.alertTxResult = function(err, result) {
  if (result.txHash) {
    Main.alertInfo('You just created an Ethereum transaction. Track its progress here: <a href="http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/tx/'+result.txHash+'" target="_blank">'+result.txHash+'</a>.');
  } else {
    Main.alertInfo('You tried to send an Ethereum transaction but there was an error: '+err);
  }
}
Main.createCookie = function(name,value,days) {
  if (localStorage) {
    localStorage.setItem(name, value);
  } else {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
  }
}
Main.readCookie = function(name) {
  if (localStorage) {
    return localStorage.getItem(name);
  } else {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  }
}
Main.eraseCookie = function(name) {
  if (localStorage) {
    localStorage.removeItem(name);
  } else {
    createCookie(name,"",-1);
  }
}
Main.logout = function() {
  addrs = [config.ethAddr];
  pks = [config.ethAddrPrivateKey];
  selectedAccount = 0;
  nonce = undefined;
  Main.refresh();
}
Main.createAccount = function() {
  var newAccount = utility.createAccount();
  var addr = newAccount.address;
  var pk = newAccount.privateKey;
  Main.addAccount(addr, pk);
  Main.alertInfo('You just created an Ethereum account: '+addr+'.');
}
Main.deleteAccount = function() {
  addrs.splice(selectedAccount, 1);
  pks.splice(selectedAccount, 1);
  selectedAccount = 0;
  nonce = undefined;
  Main.refresh();
}
Main.selectAccount = function(i) {
  selectedAccount = i;
  nonce = undefined;
  Main.refresh();
}
Main.addAccount = function(addr, pk) {
  if (addr.slice(0,2)!='0x') addr = '0x'+addr;
  if (pk.slice(0,2)=='0x') pk = pk.slice(2);
  addr = utility.toChecksumAddress(addr);
  if (pk!=undefined && pk!='' && !utility.verifyPrivateKey(addr, pk)) {
    Main.alertInfo('For account '+addr+', the private key is invalid.');
  } else if (!web3.isAddress(addr)) {
    Main.alertInfo('The specified account, '+addr+', is invalid.');
  } else {
    addrs.push(addr);
    pks.push(pk);
    selectedAccount = addrs.length-1;
    nonce = undefined;
    Main.refresh();
  }
}
Main.showPrivateKey = function() {
  var addr = addrs[selectedAccount];
  var pk = pks[selectedAccount];
  if (pk==undefined || pk=='') {
    Main.alertInfo('For account '+addr+', there is no private key available. You can still transact if you are connected to Geth and the account is unlocked.');
  } else {
    Main.alertInfo('For account '+addr+', the private key is '+pk+'.');
  }
}
Main.addressLink = function(address) {
  return 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/address/'+address;
}
Main.connectionTest = function() {
  if (connection) return connection;
  connection = {connection: 'Proxy', provider: 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io', testnet: config.ethTestnet};
  try {
    if (web3.currentProvider) {
      web3.eth.getBalance('0x0000000000000000000000000000000000000000');
      connection = {connection: 'Geth', provider: config.ethProvider, testnet: config.ethTestnet};
    }
  } catch(err) {
    web3.setProvider(undefined);
  }
  new EJS({url: config.homeURL+'/'+'connection_description.ejs'}).update('connection', {connection: connection});
  return connection;
}
Main.loadAccounts = function(callback) {
  if (Main.connectionTest().connection=='Geth') {
    $('#pk_div').hide();
  }
  if (addrs.length<=0 || addrs.length!=pks.length) {
    addrs = [config.ethAddr];
    pks = [config.ethAddrPrivateKey];
    selectedAccount = 0;
  }
  async.map(addrs,
    function(addr, callback) {
      utility.getBalance(web3, addr, function(err, balance) {
        callback(null, {addr: addr, balance: balance});
      });
    },
    function(err, addresses) {
      new EJS({url: config.homeURL+'/'+'addresses.ejs'}).update('addresses', {addresses: addresses, selectedAccount: selectedAccount});
      callback();
    }
  );
}
Main.createBackerTokens = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contractEthereumDollar, config.contractEthereumDollarAddr, 'createBackerTokens', [{gas: 150000, value: amount}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err,result) {
    txHash = result.txHash;
    nonce = result.nonce;
    Main.alertTxResult(err, result);
  });
}
Main.createDollarTokens = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contractEthereumDollar, config.contractEthereumDollarAddr, 'createDollarTokens', [{gas: 150000, value: amount}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err,result) {
    txHash = result.txHash;
    nonce = result.nonce;
    Main.alertTxResult(err, result);
  });
}
Main.redeemBackerTokens = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contractEthereumDollar, config.contractEthereumDollarAddr, 'redeemBackerTokens', [amount, {gas: 150000, value: 0}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err,result) {
    txHash = result.txHash;
    nonce = result.nonce;
    Main.alertTxResult(err, result);
  });
}
Main.redeemDollarTokens = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contractEthereumDollar, config.contractEthereumDollarAddr, 'redeemDollarTokens', [amount, {gas: 150000, value: 0}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err,result) {
    txHash = result.txHash;
    nonce = result.nonce;
    Main.alertTxResult(err, result);
  });
}
Main.transferBackerTokens = function(address,amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contractBackerToken, config.contractBackerTokenAddr, 'transfer', [address, amount, {gas: 150000, value: 0}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err,result) {
    txHash = result.txHash;
    nonce = result.nonce;
    Main.alertTxResult(err, result);
  });
}
Main.transferDollarTokens = function(address,amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contractDollarToken, config.contractDollarTokenAddr, 'transfer', [address, amount, {gas: 150000, value: 0}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err,result) {
    txHash = result.txHash;
    nonce = result.nonce;
    Main.alertTxResult(err, result);
  });
}
Main.updateExchangeRate = function() {
  var amount = utility.ethToWei(0.02);
  utility.send(web3, contractEthereumDollar, config.contractEthereumDollarAddr, 'updateExchangeRate', [{gas: 150000, value: amount}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err,result) {
    txHash = result.txHash;
    nonce = result.nonce;
    Main.alertTxResult(err, result);
  });
}
Main.updatePrice = function(callback) {
  $.getJSON('https://poloniex.com/public?command=returnTicker', function(result) {
    var ethBTC = result.BTC_ETH.last;
    $.getJSON('https://api.coindesk.com/v1/bpi/currentprice/USD.json', function(result) {
      var btcUSD = result.bpi.USD.rate;
      price = Number(ethBTC * btcUSD);
      priceUpdated = Date.now();
      callback();
    });
  });
}
Main.getPrice = function() {
  return price;
}
Main.loadEvents = function(callback) {
  utility.blockNumber(web3, function(blockNumber) {
    utility.logs(web3, contractEthereumDollar, config.contractEthereumDollarAddr, blockNumber-5760, 'latest', function(err, event) {
      event.txLink = 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/tx/'+event.transactionHash;
      eventsCache[event.transactionHash+event.logIndex] = event;
      Main.displayEvents(function(){});
    });
    utility.logs(web3, contractBackerToken, config.contractBackerTokenAddr, blockNumber-5760, 'latest', function(err, event) {
      event.txLink = 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/tx/'+event.transactionHash;
      eventsCache[event.transactionHash+event.logIndex] = event;
      Main.displayEvents(function(){});
    });
    utility.logs(web3, contractDollarToken, config.contractDollarTokenAddr, blockNumber-5760, 'latest', function(err, event) {
      event.txLink = 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/tx/'+event.transactionHash;
      eventsCache[event.transactionHash+event.logIndex] = event;
      Main.displayEvents(function(){});
    });
    callback();
  });
}
Main.displayEvents = function(callback) {
  var events = Object.values(eventsCache);
  events.sort(function(a,b){ return b.blockNumber-a.blockNumber || b.transactionIndex-a.transactionIndex });
  new EJS({url: config.homeURL+'/'+'events.ejs'}).update('events', {events: events, config: config});
  callback();
}
Main.loadStats = function(callback) {
  utility.call(web3, contractBackerToken, config.contractBackerTokenAddr, 'totalSupply', [], function(err,result) {
    var backerSupply = result;
    utility.call(web3, contractDollarToken, config.contractDollarTokenAddr, 'totalSupply', [], function(err,result) {
      var dollarSupply = result;
      utility.call(web3, contractEthereumDollar, config.contractEthereumDollarAddr, 'exchangeRate', [], function(err,result) {
        var exchangeRate = result;
        utility.call(web3, contractEthereumDollar, config.contractEthereumDollarAddr, 'backerRate', [], function(err,result) {
          var backerRate = result;
          utility.call(web3, contractEthereumDollar, config.contractEthereumDollarAddr, 'solvency', [0,0,0], function(err,result) {
            var solvency = result;
            utility.call(web3, contractBackerToken, config.contractBackerTokenAddr, 'balanceOf', [addrs[selectedAccount]], function(err,result) {
              var balanceBacker = result;
              utility.call(web3, contractDollarToken, config.contractDollarTokenAddr, 'balanceOf', [addrs[selectedAccount]], function(err,result) {
                var balanceDollar = result;
                $('#balanceBacker').html(utility.weiToEth(balanceBacker));
                $('#balanceDollar').html(utility.weiToEth(balanceDollar));
                utility.getBalance(web3, config.contractEthereumDollarAddr, function(err,balance) {
                  new EJS({url: config.homeURL+'/'+'stats.ejs'}).update('stats', {
                    backerSupply: backerSupply,
                    dollarSupply: dollarSupply,
                    solvency: solvency,
                    balance: balance,
                    ethusd: Main.getPrice(),
                    exchangeRate: exchangeRate,
                    backerRate: backerRate,
                  });
                  new EJS({url: config.homeURL+'/'+'stats_contracts.ejs'}).update('stats_contracts', {
                    contractEthereumDollarAddr: config.contractEthereumDollarAddr,
                    contractBackerTokenAddr: config.contractBackerTokenAddr,
                    contractDollarTokenAddr: config.contractDollarTokenAddr,
                  });
                  callback();
                });
              });
            });
          });
        });
      });
    });
  });
}
Main.refresh = function() {
  if (!refreshing || Date.now()-lastRefresh>60*1000) {
    refreshing = true;
    Main.createCookie("EthereumDollar", JSON.stringify({"addrs": addrs, "pks": pks, "selectedAccount": selectedAccount}), 999);
    Main.connectionTest();
    Main.loadAccounts(function(){
      Main.updatePrice(function(){
        Main.loadStats(function(){
          Main.displayEvents(function(){
            $('#loading').hide();
            refreshing = false;
            lastRefresh = Date.now();
          });
        });
      });
    });
  }
}
Main.init = function() {
  function mainLoop() {
    Main.refresh();
    setTimeout(mainLoop, 10*1000);
  }
  Main.loadEvents(function(){
    mainLoop();
  });
}

//globals
var addrs = [config.ethAddr];
var pks = [config.ethAddrPrivateKey];
var selectedAccount = 0;
var cookie = Main.readCookie("EthereumDollar");
if (cookie) {
  cookie = JSON.parse(cookie);
  addrs = cookie["addrs"];
  pks = cookie["pks"];
  selectedAccount = cookie["selectedAccount"];
}
var connection = undefined;
var nonce = undefined;
var eventsCache = {};
var refreshing = false;
var lastRefresh = Date.now();
var price = undefined;
var priceUpdated = Date.now();
var contractEthereumDollar = undefined;
var contractBackerToken = undefined;
var contractDollarToken = undefined;
//web3
var web3 = new Web3();
web3.eth.defaultAccount = config.ethAddr;
web3.setProvider(new web3.providers.HttpProvider(config.ethProvider));

utility.loadContract(web3, config.contractEthereumDollar, config.contractEthereumDollarAddr, function(err, contract){
  contractEthereumDollar = contract;
  utility.loadContract(web3, config.contractToken, config.contractBackerTokenAddr, function(contract, contract){
    contractBackerToken = contract;
    utility.loadContract(web3, config.contractToken, config.contractDollarTokenAddr, function(contract, contract){
      contractDollarToken = contract;
      Main.init();
    });
  });
});


module.exports = {Main: Main, utility: utility};
