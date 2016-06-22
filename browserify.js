var Web3 = require('web3');
var utility = require('./utility.js');
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
Main.alertTxHash = function(txHash) {
  if (txHash) {
    Main.alertInfo('You just created an Ethereum transaction. Track its progress here: <a href="http://'+(config.eth_testnet ? 'testnet.' : '')+'etherscan.io/tx/'+txHash+'" target="_blank">'+txHash+'</a>.');
  } else {
    Main.alertInfo('You tried to send an Ethereum transaction but there was an error. Check the Javascript console for details.');
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
  addrs = [config.eth_addr];
  pks = [config.eth_addr_pk];
  selectedAddr = 0;
  nonce = undefined;
  market_makers = {};
  browser_orders = [];
  Main.refresh();
}
Main.createAddress = function() {
  var newAddress = utility.createAddress();
  var addr = newAddress[0];
  var pk = newAddress[1];
  Main.addAddress(addr, pk);
  Main.alertInfo('You just created an Ethereum address: '+addr+'.');
}
Main.deleteAddress = function() {
  addrs.splice(selectedAddr, 1);
  pks.splice(selectedAddr, 1);
  selectedAddr = 0;
  nonce = undefined;
  market_makers = {};
  browser_orders = [];
  Main.refresh();
}
Main.selectAddress = function(i) {
  selectedAddr = i;
  nonce = undefined;
  market_makers = {};
  browser_orders = [];
  Main.refresh();
}
Main.addAddress = function(addr, pk) {
  if (addr.slice(0,2)!='0x') addr = '0x'+addr;
  if (pk.slice(0,2)=='0x') pk = pk.slice(2);
  addr = utility.toChecksumAddress(addr);
  if (pk!=undefined && pk!='' && !utility.verifyPrivateKey(addr, pk)) {
    Main.alertInfo('For account '+addr+', the private key is invalid.');
  } else if (!web3.isAddress(addr)) {
    Main.alertInfo('The specified address, '+addr+', is invalid.');
  } else {
    addrs.push(addr);
    pks.push(pk);
    selectedAddr = addrs.length-1;
    nonce = undefined;
    market_makers = {};
    browser_orders = [];
    Main.refresh();
  }
}
Main.showPrivateKey = function() {
  var addr = addrs[selectedAddr];
  var pk = pks[selectedAddr];
  if (pk==undefined || pk=='') {
    Main.alertInfo('For account '+addr+', there is no private key available. You can still transact if you are connected to Geth and the account is unlocked.');
  } else {
    Main.alertInfo('For account '+addr+', the private key is '+pk+'.');
  }
}
Main.addressLink = function(address) {
  return 'http://'+(config.eth_testnet ? 'testnet.' : '')+'etherscan.io/address/'+address;
}
Main.connectionTest = function() {
  if (connection) return connection;
  connection = {connection: 'Proxy', provider: 'http://'+(config.eth_testnet ? 'testnet.' : '')+'etherscan.io', testnet: config.eth_testnet};
  try {
    if (web3.currentProvider) {
      web3.eth.getBalance('0x0000000000000000000000000000000000000000');
      connection = {connection: 'Geth', provider: config.eth_provider, testnet: config.eth_testnet};
    }
  } catch(err) {
    web3.setProvider(undefined);
  }
  new EJS({url: config.home_url+'/'+'connection_description.ejs'}).update('connection', {connection: connection});
  return connection;
}
Main.loadAddresses = function(callback) {
  if (Main.connectionTest().connection=='Geth') {
    $('#pk_div').hide();
  }
  if (addrs.length<=0 || addrs.length!=pks.length) {
    addrs = [config.eth_addr];
    pks = [config.eth_addr_pk];
    selectedAddr = 0;
  }
  async.map(addrs,
    function(addr, callback) {
      utility.getBalance(web3, addr, function(balance) {
        callback(null, {addr: addr, balance: balance});
      });
    },
    function(err, addresses) {
      new EJS({url: config.home_url+'/'+'addresses.ejs'}).update('addresses', {addresses: addresses, selectedAddr: selectedAddr});
      callback();
    }
  );
}
Main.createBackerTokens = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, 'createBackerTokens', [{gas: 150000, value: amount}], addrs[selectedAddr], pks[selectedAddr], nonce, function(result) {
    txHash = result[0];
    nonce = result[1];
    Main.alertTxHash(txHash);
  });
}
Main.createDollarTokens = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, 'createDollarTokens', [{gas: 150000, value: amount}], addrs[selectedAddr], pks[selectedAddr], nonce, function(result) {
    txHash = result[0];
    nonce = result[1];
    Main.alertTxHash(txHash);
  });
}
Main.redeemBackerTokens = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, 'redeemBackerTokens', [amount, {gas: 150000, value: 0}], addrs[selectedAddr], pks[selectedAddr], nonce, function(result) {
    txHash = result[0];
    nonce = result[1];
    Main.alertTxHash(txHash);
  });
}
Main.redeemDollarTokens = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, 'redeemDollarTokens', [amount, {gas: 150000, value: 0}], addrs[selectedAddr], pks[selectedAddr], nonce, function(result) {
    txHash = result[0];
    nonce = result[1];
    Main.alertTxHash(txHash);
  });
}
Main.transferBackerTokens = function(address,amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contract_backertoken, config.contract_backertoken_addr, 'transfer', [address, amount, {gas: 150000, value: 0}], addrs[selectedAddr], pks[selectedAddr], nonce, function(result) {
    txHash = result[0];
    nonce = result[1];
    Main.alertTxHash(txHash);
  });
}
Main.transferDollarTokens = function(address,amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contract_dollartoken, config.contract_dollartoken_addr, 'transfer', [address, amount, {gas: 150000, value: 0}], addrs[selectedAddr], pks[selectedAddr], nonce, function(result) {
    txHash = result[0];
    nonce = result[1];
    Main.alertTxHash(txHash);
  });
}
Main.updateExchangeRate = function() {
  var amount = utility.ethToWei(0.01);
  utility.send(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, 'updateExchangeRate', [{gas: 150000, value: amount}], addrs[selectedAddr], pks[selectedAddr], nonce, function(result) {
    txHash = result[0];
    nonce = result[1];
    Main.alertTxHash(txHash);
  });
}
Main.updatePrice = function(callback) {
  $.getJSON('https://poloniex.com/public?command=returnTicker', function(result) {
    var eth_btc = result.BTC_ETH.last;
    $.getJSON('https://api.coindesk.com/v1/bpi/currentprice/USD.json', function(result) {
      var btc_usd = result.bpi.USD.rate;
      price = Number(eth_btc * btc_usd);
      price_updated = Date.now();
      callback();
    });
  });
}
Main.getPrice = function() {
  return price;
}
Main.loadEvents = function(callback) {
  utility.blockNumber(web3, function(blockNumber) {
    utility.logs(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, blockNumber-5760, 'latest', function(event) {
      event.tx_link = 'http://'+(config.eth_testnet ? 'testnet.' : '')+'etherscan.io/tx/'+event.transactionHash;
      events_cache[event.transactionHash+event.logIndex] = event;
      Main.displayEvents(function(){});
    });
    utility.logs(web3, contract_backertoken, config.contract_backertoken_addr, blockNumber-5760, 'latest', function(event) {
      event.tx_link = 'http://'+(config.eth_testnet ? 'testnet.' : '')+'etherscan.io/tx/'+event.transactionHash;
      events_cache[event.transactionHash+event.logIndex] = event;
      Main.displayEvents(function(){});
    });
    utility.logs(web3, contract_dollartoken, config.contract_dollartoken_addr, blockNumber-5760, 'latest', function(event) {
      event.tx_link = 'http://'+(config.eth_testnet ? 'testnet.' : '')+'etherscan.io/tx/'+event.transactionHash;
      events_cache[event.transactionHash+event.logIndex] = event;
      Main.displayEvents(function(){});
    });
    callback();
  });
}
Main.displayEvents = function(callback) {
  var events = Object.values(events_cache);
  events.sort(function(a,b){ return a.blockNumber*1000+a.transactionIndex>b.blockNumber*1000+b.transactionIndex ? -1 : 1 });
  new EJS({url: config.home_url+'/'+'events.ejs'}).update('events', {events: events, config: config});
  callback();
}
Main.loadStats = function(callback) {
  utility.call(web3, contract_backertoken, config.contract_backertoken_addr, 'totalSupply', [], function(result) {
    var backer_supply = result;
    utility.call(web3, contract_dollartoken, config.contract_dollartoken_addr, 'totalSupply', [], function(result) {
      var dollar_supply = result;
      utility.call(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, 'exchangeRate', [], function(result) {
        var exchange_rate = result;
        utility.call(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, 'backerRate', [], function(result) {
          var backer_rate = result;
          utility.call(web3, contract_ethereumdollar, config.contract_ethereumdollar_addr, 'solvency', [0,0,0], function(result) {
            var solvency = result;
            utility.call(web3, contract_backertoken, config.contract_backertoken_addr, 'balanceOf', [addrs[selectedAddr]], function(result) {
              var balance_backer = result;
              utility.call(web3, contract_dollartoken, config.contract_dollartoken_addr, 'balanceOf', [addrs[selectedAddr]], function(result) {
                var balance_dollar = result;
                $('#balance_backer').html(utility.weiToEth(balance_backer));
                $('#balance_dollar').html(utility.weiToEth(balance_dollar));
                utility.getBalance(web3, config.contract_ethereumdollar_addr, function(balance) {
                  new EJS({url: config.home_url+'/'+'stats.ejs'}).update('stats', {
                    backer_supply: backer_supply,
                    dollar_supply: dollar_supply,
                    solvency: solvency,
                    balance: balance,
                    ethusd: Main.getPrice(),
                    exchange_rate: exchange_rate,
                    backer_rate: backer_rate,
                  });
                  new EJS({url: config.home_url+'/'+'stats_contracts.ejs'}).update('stats_contracts', {
                    contract_ethereumdollar_addr: config.contract_ethereumdollar_addr,
                    contract_backertoken_addr: config.contract_backertoken_addr,
                    contract_dollartoken_addr: config.contract_dollartoken_addr,
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
  if (!refreshing || Date.now()-last_refresh>60*1000) {
    refreshing = true;
    Main.createCookie("user_ethereumdollar", JSON.stringify({"addrs": addrs, "pks": pks, "selectedAddr": selectedAddr}), 999);
    Main.connectionTest();
    Main.loadAddresses(function(){
      Main.updatePrice(function(){
        Main.loadStats(function(){
          Main.displayEvents(function(){
            $('#loading').hide();
            refreshing = false;
            last_refresh = Date.now();
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
var addrs = [config.eth_addr];
var pks = [config.eth_addr_pk];
var selectedAddr = 0;
var cookie = Main.readCookie("user_ethereumdollar");
if (cookie) {
  cookie = JSON.parse(cookie);
  addrs = cookie["addrs"];
  pks = cookie["pks"];
  selectedAddr = cookie["selectedAddr"];
}
var connection = undefined;
var nonce = undefined;
var events_cache = {};
var refreshing = false;
var last_refresh = Date.now();
var price = undefined;
var price_updated = Date.now();
var contract_ethereumdollar = undefined;
var contract_backertoken = undefined;
var contract_dollartoken = undefined;
//web3
var web3 = new Web3();
web3.eth.defaultAccount = config.eth_addr;
web3.setProvider(new web3.providers.HttpProvider(config.eth_provider));

//get contracts
function loadContract(source_code, address, callback) {
  utility.readFile(source_code+'.bytecode', function(result){
    utility.readFile(source_code+'.interface', function(result){
      bytecode = JSON.parse(result);
      abi = JSON.parse(result);
      var contract = web3.eth.contract(abi);
      contract = contract.at(address);
      callback(contract, address);
    });
  });
}

loadContract(config.contract_ethereumdollar, config.contract_ethereumdollar_addr, function(contract, address){
  contract_ethereumdollar = contract;
  loadContract(config.contract_token, config.contract_backertoken_addr, function(contract, address){
    contract_backertoken = contract;
    loadContract(config.contract_token, config.contract_dollartoken_addr, function(contract, address){
      contract_dollartoken = contract;
      Main.init();
    });
  });
});


module.exports = {Main: Main, utility: utility};
