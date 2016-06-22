var request = require('request');
var async = require('async');
var gaussian = require('gaussian');

//contract

var backer_accounts = [];
var backer_supply = 0;
var dollar_accounts = [];
var dollar_supply = 0;
var exchange_rate = 10;
var balance = 0;
var solvency_to_create_dollar_tokens = 1.3;
var solvency_to_redeem_backer_tokens = 1.0;
var fee_percentage = 0.01;
var fees = 0;

function reset_accounts() {
  backer_accounts = [0];
  backer_supply = 0;
  dollar_accounts = [0];
  dollar_supply = 0;
  exchange_rate = 10;
  balance = 0;
  fees = 0;
}

function backer_rate() {
  if (backer_supply>0) {
    if (solvency(0,0,0)>=1.0) {
      return (balance - dollar_supply / exchange_rate) / backer_supply;
    } else {
      return 0.000001;
    }
  } else {
    return 1.0;
  }
}

function solvency(create_dollar_tokens, redeem_backer_tokens, redeem_dollar_tokens) {
  var rate = 0;
  if (redeem_backer_tokens != 0) {
    rate = backer_rate();
  }
  var balance_usd = (balance - redeem_backer_tokens * rate + create_dollar_tokens) * exchange_rate - redeem_dollar_tokens;
  var dollar_supply_usd = dollar_supply + create_dollar_tokens * exchange_rate - redeem_dollar_tokens;
  if (dollar_supply_usd>0) {
    return balance_usd / dollar_supply_usd;
  } else {
    return 1.0;
  }
}

function create_backer_tokens(amount, account) {
  if (amount>0) {
    if (typeof(account)=='undefined') {
      account = backer_accounts.length;
      backer_accounts[account] = 0;
    }
    var rate = backer_rate();
    fees += amount * fee_percentage;
    backer_accounts[account] += (amount * (1 - fee_percentage)) / rate;
    backer_supply += (amount * (1 - fee_percentage)) / rate;
    balance += amount;
  } else {
    //throw
  }
}

function create_dollar_tokens(amount, account) {
  if (amount>0 && solvency(amount,0,0)>solvency_to_create_dollar_tokens) {
    if (typeof(account)=='undefined') {
      account = dollar_accounts.length;
      dollar_accounts[account] = 0;
    }
    fees += amount * fee_percentage;
    dollar_accounts[account] += (amount * (1 - fee_percentage)) * exchange_rate;
    dollar_supply += (amount * (1 - fee_percentage)) * exchange_rate;
    balance += amount;
  } else {
    //throw
  }
}

function redeem_backer_tokens(amount, account) {
  var rate = backer_rate();
  if (amount>0 && amount<=backer_accounts[account] && solvency(0,amount,0)>solvency_to_redeem_backer_tokens) {
    backer_accounts[account] -= amount;
    backer_supply -= amount;
    fees += (amount * fee_percentage) * rate;
    balance -= (amount * (1 - fee_percentage)) * rate;
    //send account (amount*(1-fee_percentage))*rate ether
  } else {
    //throw
  }
}

function redeem_dollar_tokens(amount, account) {
  if (amount>0 && amount<=dollar_accounts[account] && solvency(0,0,amount)>1.0) {
    dollar_accounts[account] -= amount;
    dollar_supply -= amount;
    fees += (amount * fee_percentage) / exchange_rate;
    balance -= (amount * (1 - fee_percentage)) / exchange_rate;
    //send account (amount*(1-fee_percentage))/exchange_rate ether
  } else {
    //throw
  }
}

function update_exchange_rate(rate) {
  exchange_rate = rate;
}

function print_status() {
  console.log('Backer token accounts');
  var rate = backer_rate();
  for (var i=0; i<backer_accounts.length; i++) {
    console.log(i+': '+backer_accounts[i]+' tokens, '+backer_accounts[i]*rate+' ETH, '+backer_accounts[i]*rate*exchange_rate+' USD')
  }
  console.log('------');
  console.log('Dollar token accounts');
  for (var i=0; i<dollar_accounts.length; i++) {
    console.log(i+': '+dollar_accounts[i]+' tokens, '+dollar_accounts[i]/exchange_rate+' ETH, '+dollar_accounts[i]+' USD')
  }
  console.log('------');
  console.log('Backer token supply: '+backer_supply+' backer tokens, '+backer_supply*rate+' ETH, '+backer_supply*rate*exchange_rate+' USD');
  console.log('Dollar token supply: '+dollar_supply+' dollar tokens, '+dollar_supply/exchange_rate+' ETH, '+dollar_supply+' USD');
  console.log('Balance: '+balance+' ETH, '+balance*exchange_rate+' USD');
  console.log('Exchange rate: '+exchange_rate+' ETH/USD');
  console.log('Backer rate: '+backer_rate()+' token/ETH');
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
      update_exchange_rate(prices[i]);
      if (backer_creation>0) create_backer_tokens(backer_creation);
      if (dollar_creation>0) create_dollar_tokens(dollar_creation);
      if (!solvency(0,0,0)>1.0) console.log('Not solvent');
    }
    print_status();

    //creation and redemption test
    reset_accounts();
    create_backer_tokens(1000);
    create_backer_tokens(1000);
    create_dollar_tokens(500);
    create_dollar_tokens(500);
    update_exchange_rate(20);
    print_status();
    redeem_backer_tokens(500,1);
    redeem_dollar_tokens(2500,1);
    print_status();
  }
);
