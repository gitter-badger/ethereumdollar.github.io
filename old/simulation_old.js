var investments = [];
var total_invested = 0;
var profit_adjusts = [];
var total_profit_adjust = 0;
var minted_dollars = [];
var total_minted_dollars = 0;
var mint_proceeds = 0;
var exchange_rate = 10;
var maximum_reserve_ratio = 0.5;

function print_state() {
  console.log("Balances");
  console.log("---");
  var total = 0;
  for(var i=0; i<investments.length; i++) {
    total += get_balance(i);
    console.log(i, get_balance(i));
  }
  console.log("Total (ETH)", total);
  console.log("---");
  console.log("Exchange rate (ETH/USD)", 10);
  console.log("Minted dollars (EUSD)", total_minted_dollars);
  console.log("Mint proceeds (ETH)", mint_proceeds);
  console.log("Balance (ETH)", total_invested + total_profit_adjust + mint_proceeds);
  console.log("Balance (USD)", (total_invested + total_profit_adjust + mint_proceeds)*exchange_rate);
  console.log("Reserve ratio", reserve_ratio());
  console.log("Profit", profit());
  console.log("---");
}

function reserve_ratio(new_minted_amount, withdrawal) {
  if (typeof(new_minted_amount)=='undefined') {
    new_minted_amount = 0;
  }
  if (typeof(withdrawal)=='undefined') {
    withdrawal = 0;
  }
  return (total_minted_dollars + new_minted_amount*exchange_rate) / ((total_invested + total_profit_adjust + mint_proceeds + new_minted_amount - withdrawal)*exchange_rate);
}

function get_balance(account) {
  return investments[account] / total_invested * (total_invested + profit());
}

function deposit(amount, account) {
  if (amount==-(total_invested+profit())) {
    //throw, return amount to the user
  } else {
    var new_balance = amount;
    if (typeof(account)!='undefined') {
      new_balance = get_balance(account) + amount;
      total_profit_adjust -= (get_balance(account) - investments[account]);
      total_invested -= investments[account];
      investments[account] = 0;
      profit_adjusts[account] = 0;
    } else {
      investments.push(0);
      profit_adjusts.push(0);
      account = investments.length - 1;
    }
    var investment = total_invested+profit()!=0 ? new_balance * total_invested / (total_invested+profit()) : new_balance;
    investments[account] = investment;
    total_invested += investment;
    var profit_adjust = new_balance - investment;
    profit_adjusts[account] = profit_adjust;
    total_profit_adjust += profit_adjust;
    return account;
  }
}

function withdraw(amount, account) {
  if (amount<=get_balance(account) && (reserve_ratio(undefined, amount)<=maximum_reserve_ratio)) {
    deposit(-amount, account);
    //send amount to the user
  }
}

function mint_dollars(amount, account) { //amount is in ether
  if (typeof(account)=='undefined') {
    account = minted_dollars.length - 1;
  }
  if (reserve_ratio(amount,undefined)<=maximum_reserve_ratio) {
    minted_dollars[account] = amount * exchange_rate;
    total_minted_dollars += amount * exchange_rate;
    mint_proceeds += amount;
  } else {
    //throw, return amount to user
  }
}

function profit() {
  return (mint_proceeds*exchange_rate-total_minted_dollars)/exchange_rate + total_profit_adjust;
}

function update_exchange_rate(new_rate) {
  exchange_rate = new_rate;
}

for(var i=0; i<10; i++) {
  deposit(100);
}
mint_dollars(1000);
update_exchange_rate(2.5);
// withdraw(100, 0);
// update_exchange_rate(40);
// deposit(2001);
// update_exchange_rate(10);
console.log(investments);
console.log(profit_adjusts);
print_state();
