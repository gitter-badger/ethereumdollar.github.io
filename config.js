var config = {};

config.homeURL = 'https://ethereumdollar.github.io';
config.homeURL = 'http://localhost:8080';
config.contractEthereumDollar = 'ethereumdollar.sol';
config.contractToken = 'reservetoken.sol';
config.contractEthereumDollarAddr = '0xfe30c2b02319aa68a44975eec1b69933f4ac6592';
config.contractBackerTokenAddr = '0xf0c3d5c1a8f181f365d906447b67ea6510a8ac93';
config.contractDollarTokenAddr = '0xedbaad5f8053f17a4a2ad829fd12c5d1332c9f1a';
config.ethTestnet = true;
config.ethProvider = 'http://localhost:8545';
config.ethGasPrice = 20000000000;
config.ethAddr = '0x0000000000000000000000000000000000000000';
config.ethAddrPrivateKey = '';

try {
  global.config = config;
  module.exports = config;
} catch (err) {}
