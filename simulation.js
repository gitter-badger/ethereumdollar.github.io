var request = require('request');
var async = require('async');
var gaussian = require('gaussian');

//contract

var backerAccounts = [];
var backerSupply = 0;
var dollarAccounts = [];
var dollarSupply = 0;
var exchangeRate = 10;
var balance = 0;
var solvencyToCreateDollarTokens = 1.3;
var solvencyToRedeemBackerTokens = 1.0;
var feePercentage = 0.01;
var fees = 0;
var saviorMode = false;

function backerRate() {
  if (backerSupply>0) {
    if (solvency(0,0,0)>=1.0) {
      return (balance - dollarSupply / exchangeRate) / backerSupply;
    } else {
      return 0.0;
    }
  } else {
    return 1.0;
  }
}

function solvency(create_dollar_tokens, redeem_backer_tokens, redeem_dollar_tokens) {
  var rate = 0;
  if (redeem_backer_tokens != 0) {
    rate = backerRate();
  }
  var balance_usd = (balance - redeem_backer_tokens * rate + create_dollar_tokens) * exchangeRate - redeem_dollar_tokens;
  var dollarSupply_usd = dollarSupply + create_dollar_tokens * exchangeRate - redeem_dollar_tokens;
  if (dollarSupply_usd>0) {
    return balance_usd / dollarSupply_usd;
  } else {
    return 1.0;
  }
}

function create_backer_tokens(amount, account) {
  if (amount<=0) return;
  if (typeof(account)=='undefined') {
    account = backerAccounts.length;
    backerAccounts[account] = 0;
  }
  var rate = backerRate();
  if (rate<=0) { //insolvent
    if (!saviorMode) {
      saviorMode = true;
      backerAccounts = {};
      backerSupply = 0;
    }
    fees += amount * feePercentage;
    backerAccounts[account] += (amount * (1 - feePercentage)) / rate;
    backerSupply += (amount * (1 - feePercentage)) / rate;
    dollarAccounts[account] += (amount * (1 - feePercentage)) * exchangeRate;
    dollarSupply += (amount * (1 - feePercentage)) * exchangeRate;
    balance += amount;
  } else {
    saviorMode = false;
    fees += amount * feePercentage;
    backerAccounts[account] += (amount * (1 - feePercentage)) / rate;
    backerSupply += (amount * (1 - feePercentage)) / rate;
    balance += amount;
  }
}

function create_dollar_tokens(amount, account) {
  if (amount<=0 || solvency(amount,0,0)<solvencyToCreateDollarTokens) return;
  if (typeof(account)=='undefined') {
    account = dollarAccounts.length;
    dollarAccounts[account] = 0;
  }
  saviorMode = false;
  fees += amount * feePercentage;
  dollarAccounts[account] += (amount * (1 - feePercentage)) * exchangeRate;
  dollarSupply += (amount * (1 - feePercentage)) * exchangeRate;
  balance += amount;
}

function redeem_backer_tokens(amount, account) {
  if (amount<=0 || amount>backerAccounts[account] || solvency(0,amount,0)<solvencyToRedeemBackerTokens) return;
  saviorMode = false;
  var rate = backerRate();
  backerAccounts[account] -= amount;
  backerSupply -= amount;
  fees += (amount * feePercentage) * rate;
  balance -= (amount * (1 - feePercentage)) * rate;
  //send account (amount*(1-feePercentage))*rate ether
}

function redeem_dollar_tokens(amount, account) {
  if (amount<=0 || amount>dollarAccounts[account] || solvency(0,0,amount)<1.0) return;
  saviorMode = false;
  dollarAccounts[account] -= amount;
  dollarSupply -= amount;
  fees += (amount * feePercentage) / exchangeRate;
  balance -= (amount * (1 - feePercentage)) / exchangeRate;
  //send account (amount*(1-feePercentage))/exchangeRate ether
}

function update_exchangeRate(rate) {
  exchangeRate = rate;
}

function print_status() {
  console.log('Backer token accounts');
  var rate = backerRate();
  for (var i=0; i<backerAccounts.length; i++) {
    console.log(i+': '+backerAccounts[i]+' tokens, '+backerAccounts[i]*rate+' ETH, '+backerAccounts[i]*rate*exchangeRate+' USD')
  }
  console.log('------');
  console.log('Dollar token accounts');
  for (var i=0; i<dollarAccounts.length; i++) {
    console.log(i+': '+dollarAccounts[i]+' tokens, '+dollarAccounts[i]/exchangeRate+' ETH, '+dollarAccounts[i]+' USD')
  }
  console.log('------');
  console.log('Backer token supply: '+backerSupply+' backer tokens, '+backerSupply*rate+' ETH, '+backerSupply*rate*exchangeRate+' USD');
  console.log('Dollar token supply: '+dollarSupply+' dollar tokens, '+dollarSupply/exchangeRate+' ETH, '+dollarSupply+' USD');
  console.log('Balance: '+balance+' ETH, '+balance*exchangeRate+' USD');
  console.log('Exchange rate: '+exchangeRate+' ETH/USD');
  console.log('Backer rate: '+backerRate()+' token/ETH');
  console.log('Solvency: '+(solvency(0,0,0)));
  console.log('Fees: '+fees);
  console.log('------');
}


//simulation

var backer_creation_mean = 100;
var backer_creation_sigma = 50;
var dollar_creation_mean = 2000;
var dollar_creation_sigma = 50;
var period = 86400; //1 day bars
var days_data = 200; //200 days

var start = Math.ceil(Date.now()/1000 - days_data*86400);
var end = Math.ceil(Date.now()/1000);
var prices_btc = undefined;
var prices_eth = undefined;

var url = 'https://poloniex.com/public?command=returnChartData&currencyPair=USDT_BTC&start='+start+'&end='+end+'&period='+period;
request.get(url, function(err, httpResponse, body) {
  try {
    var result = JSON.parse(body);
    prices_btc = result.map(function(x) {return x['close']});
  } catch (err) {
    console.log("Error getting Poloniex historical prices", err);
    callback(undefined);
  }
});
var url = 'https://poloniex.com/public?command=returnChartData&currencyPair=BTC_ETH&start='+start+'&end='+end+'&period='+period;
request.get(url, function(err, httpResponse, body) {
  try {
    var result = JSON.parse(body);
    prices_eth = result.map(function(x) {return x['close']});
  } catch (err) {
    console.log("Error getting Poloniex historical prices", err);
    callback(undefined);
  }
});
async.whilst(
  function () { return prices_eth==undefined || prices_btc==undefined; },
  function (callback) {
      setTimeout(function () {
          callback(null);
      }, 1000);
  },
  function (err) {
    var prices = [];
    for (var i = 0; i<Math.min(prices_btc.length,prices_eth.length)-1; i++) {
      prices.push(prices_btc[Math.max(i+prices_btc.length-prices_eth.length,0)]*prices_eth[Math.max(i+prices_eth.length-prices_btc.length,0)]);
    }

    for (var i=0; i<prices.length; i++) {
      var backer_creation = gaussian(backer_creation_mean, Math.pow(backer_creation_sigma,2)).ppf(Math.random());
      var dollar_creation = gaussian(dollar_creation_mean, Math.pow(dollar_creation_sigma,2)).ppf(Math.random());
      update_exchangeRate(prices[i]);
      if (backer_creation>0) create_backer_tokens(backer_creation);
      if (dollar_creation>0) create_dollar_tokens(dollar_creation);
      if (!solvency(0,0,0)>1.0) console.log('Not solvent');
    }
    print_status();
  }
);
