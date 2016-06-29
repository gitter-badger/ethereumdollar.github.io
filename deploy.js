var config = require('./config.js');
var utility = require('./common/utility.js');
var async = (typeof(window) === 'undefined') ? require('async') : require('async/dist/async.min.js');
var fs = require('fs');
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var commandLineArgs = require('command-line-args');

var cli = commandLineArgs([
	{ name: 'help', alias: 'h', type: Boolean },
	{ name: 'address', type: String }
]);
var cliOptions = cli.parse()

if (cliOptions.help) {
	console.log(cli.getUsage());
} else {
  var web3 = new Web3();
	web3.eth.defaultAccount = cliOptions.address;
	web3.setProvider(new web3.providers.HttpProvider(config.ethProvider));

  utility.deployContract(web3, config.contractToken, 'ReserveToken', [], cliOptions.address, function(err, contractBackerTokenAddr){
    utility.deployContract(web3, config.contractToken, 'ReserveToken', [], cliOptions.address, function(err, contractDollarTokenAddr){
      exchangeRate = new BigNumber(utility.ethToWei(10.0));
      solvencyCreateDollar = new BigNumber(utility.ethToWei(1.3));
      solvencyRedeemBacker = new BigNumber(utility.ethToWei(1.0));
      feePercentage = new BigNumber(utility.ethToWei(0.01));
      feeAccount = cliOptions.address;
      utility.deployContract(web3, config.contractEthereumDollar, 'EthereumDollar', [contractDollarTokenAddr, contractBackerTokenAddr, exchangeRate, solvencyCreateDollar, solvencyRedeemBacker, feePercentage, feeAccount], cliOptions.address, function(err, contractEthereumDollarAddr){
				console.log("config.contractEthereumDollarAddr = '"+contractEthereumDollarAddr+"';");
				console.log("config.contractBackerTokenAddr = '"+contractBackerTokenAddr+"';");
				console.log("config.contractDollarTokenAddr = '"+contractDollarTokenAddr+"';");
      });
    });
  });
}
