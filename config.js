var config = {};

config.home_url = 'https://ethereumdollar.github.io';
// config.home_url = 'http://localhost:8080';
config.contract_ethereumdollar = 'ethereumdollar.sol';
config.contract_token = 'reservetoken.sol';
config.contract_ethereumdollar_addr = '0xf076ae262f62f07a9404c283a7ab2eb345ec760d';
config.contract_backertoken_addr = '0x24f49cf37b697636c86c7d911c9b5f67038ed89f';
config.contract_dollartoken_addr = '0x81694b0c5b2a88b5ff3d6368eaa5d94f9ab9cb6e';
config.eth_testnet = true;
config.eth_provider = 'http://localhost:8545';
config.eth_gas_price = 20000000000;
config.eth_addr = '0x0000000000000000000000000000000000000000';
config.eth_addr_pk = '';

try {
  global.config = config;
  module.exports = config;
} catch (err) {}
