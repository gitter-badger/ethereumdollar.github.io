// <ORACLIZE_API>
/*
Copyright (c) 2015-2016 Oraclize srl, Thomas Bertani



Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:



The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.



THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

contract OraclizeI {
    address public cbAddress;
    function query(uint _timestamp, string _datasource, string _arg) returns (bytes32 _id);
    function query_withGasLimit(uint _timestamp, string _datasource, string _arg, uint _gaslimit) returns (bytes32 _id);
    function query2(uint _timestamp, string _datasource, string _arg1, string _arg2) returns (bytes32 _id);
    function query2_withGasLimit(uint _timestamp, string _datasource, string _arg1, string _arg2, uint _gaslimit) returns (bytes32 _id);
    function getPrice(string _datasource) returns (uint _dsprice);
    function getPrice(string _datasource, uint gaslimit) returns (uint _dsprice);
    function useCoupon(string _coupon);
    function setProofType(byte _proofType);
}
contract OraclizeAddrResolverI {
    function getAddress() returns (address _addr);
}
contract usingOraclize {
    uint constant day = 60*60*24;
    uint constant week = 60*60*24*7;
    uint constant month = 60*60*24*30;
    byte constant proofType_NONE = 0x00;
    byte constant proofType_TLSNotary = 0x10;
    byte constant proofStorage_IPFS = 0x01;
    uint8 constant networkID_auto = 0;
    uint8 constant networkID_mainnet = 1;
    uint8 constant networkID_testnet = 2;
    uint8 constant networkID_morden = 2;
    uint8 constant networkID_consensys = 161;

    OraclizeAddrResolverI OAR;

    OraclizeI oraclize;
    modifier oraclizeAPI {
        address oraclizeAddr = OAR.getAddress();
        if (oraclizeAddr == 0){
            oraclize_setNetwork(networkID_auto);
            oraclizeAddr = OAR.getAddress();
        }
        oraclize = OraclizeI(oraclizeAddr);
        _
    }
    modifier coupon(string code){
        oraclize = OraclizeI(OAR.getAddress());
        oraclize.useCoupon(code);
        _
    }

    function oraclize_setNetwork(uint8 networkID) internal returns(bool){
        if (getCodeSize(0x1d3b2638a7cc9f2cb3d298a3da7a90b67e5506ed)>0){
            OAR = OraclizeAddrResolverI(0x1d3b2638a7cc9f2cb3d298a3da7a90b67e5506ed);
            return true;
        }
        if (getCodeSize(0x9efbea6358bed926b293d2ce63a730d6d98d43dd)>0){
            OAR = OraclizeAddrResolverI(0x9efbea6358bed926b293d2ce63a730d6d98d43dd);
            return true;
        }
        if (getCodeSize(0x20e12a1f859b3feae5fb2a0a32c18f5a65555bbf)>0){
            OAR = OraclizeAddrResolverI(0x20e12a1f859b3feae5fb2a0a32c18f5a65555bbf);
            return true;
        }
        return false;
    }

    function oraclize_query(string datasource, string arg) oraclizeAPI internal returns (bytes32 id){
        uint price = oraclize.getPrice(datasource);
        if (price > 1 ether + tx.gasprice*200000) return 0; // unexpectedly high price
        return oraclize.query.value(price)(0, datasource, arg);
    }
    function oraclize_query(uint timestamp, string datasource, string arg) oraclizeAPI internal returns (bytes32 id){
        uint price = oraclize.getPrice(datasource);
        if (price > 1 ether + tx.gasprice*200000) return 0; // unexpectedly high price
        return oraclize.query.value(price)(timestamp, datasource, arg);
    }
    function oraclize_query(uint timestamp, string datasource, string arg, uint gaslimit) oraclizeAPI internal returns (bytes32 id){
        uint price = oraclize.getPrice(datasource, gaslimit);
        if (price > 1 ether + tx.gasprice*gaslimit) return 0; // unexpectedly high price
        return oraclize.query_withGasLimit.value(price)(timestamp, datasource, arg, gaslimit);
    }
    function oraclize_query(string datasource, string arg, uint gaslimit) oraclizeAPI internal returns (bytes32 id){
        uint price = oraclize.getPrice(datasource, gaslimit);
        if (price > 1 ether + tx.gasprice*gaslimit) return 0; // unexpectedly high price
        return oraclize.query_withGasLimit.value(price)(0, datasource, arg, gaslimit);
    }
    function oraclize_query(string datasource, string arg1, string arg2) oraclizeAPI internal returns (bytes32 id){
        uint price = oraclize.getPrice(datasource);
        if (price > 1 ether + tx.gasprice*200000) return 0; // unexpectedly high price
        return oraclize.query2.value(price)(0, datasource, arg1, arg2);
    }
    function oraclize_query(uint timestamp, string datasource, string arg1, string arg2) oraclizeAPI internal returns (bytes32 id){
        uint price = oraclize.getPrice(datasource);
        if (price > 1 ether + tx.gasprice*200000) return 0; // unexpectedly high price
        return oraclize.query2.value(price)(timestamp, datasource, arg1, arg2);
    }
    function oraclize_query(uint timestamp, string datasource, string arg1, string arg2, uint gaslimit) oraclizeAPI internal returns (bytes32 id){
        uint price = oraclize.getPrice(datasource, gaslimit);
        if (price > 1 ether + tx.gasprice*gaslimit) return 0; // unexpectedly high price
        return oraclize.query2_withGasLimit.value(price)(timestamp, datasource, arg1, arg2, gaslimit);
    }
    function oraclize_query(string datasource, string arg1, string arg2, uint gaslimit) oraclizeAPI internal returns (bytes32 id){
        uint price = oraclize.getPrice(datasource, gaslimit);
        if (price > 1 ether + tx.gasprice*gaslimit) return 0; // unexpectedly high price
        return oraclize.query2_withGasLimit.value(price)(0, datasource, arg1, arg2, gaslimit);
    }
    function oraclize_cbAddress() oraclizeAPI internal returns (address){
        return oraclize.cbAddress();
    }
    function oraclize_setProof(byte proofP) oraclizeAPI internal {
        return oraclize.setProofType(proofP);
    }

    function getCodeSize(address _addr) constant internal returns(uint _size) {
        assembly {
            _size := extcodesize(_addr)
        }
    }


    function parseAddr(string _a) internal returns (address){
        bytes memory tmp = bytes(_a);
        uint160 iaddr = 0;
        uint160 b1;
        uint160 b2;
        for (uint i=2; i<2+2*20; i+=2){
            iaddr *= 256;
            b1 = uint160(tmp[i]);
            b2 = uint160(tmp[i+1]);
            if ((b1 >= 97)&&(b1 <= 102)) b1 -= 87;
            else if ((b1 >= 48)&&(b1 <= 57)) b1 -= 48;
            if ((b2 >= 97)&&(b2 <= 102)) b2 -= 87;
            else if ((b2 >= 48)&&(b2 <= 57)) b2 -= 48;
            iaddr += (b1*16+b2);
        }
        return address(iaddr);
    }


    function strCompare(string _a, string _b) internal returns (int) {
        bytes memory a = bytes(_a);
        bytes memory b = bytes(_b);
        uint minLength = a.length;
        if (b.length < minLength) minLength = b.length;
        for (uint i = 0; i < minLength; i ++)
            if (a[i] < b[i])
                return -1;
            else if (a[i] > b[i])
                return 1;
        if (a.length < b.length)
            return -1;
        else if (a.length > b.length)
            return 1;
        else
            return 0;
   }

    function indexOf(string _haystack, string _needle) internal returns (int)
    {
        bytes memory h = bytes(_haystack);
        bytes memory n = bytes(_needle);
        if(h.length < 1 || n.length < 1 || (n.length > h.length))
            return -1;
        else if(h.length > (2**128 -1))
            return -1;
        else
        {
            uint subindex = 0;
            for (uint i = 0; i < h.length; i ++)
            {
                if (h[i] == n[0])
                {
                    subindex = 1;
                    while(subindex < n.length && (i + subindex) < h.length && h[i + subindex] == n[subindex])
                    {
                        subindex++;
                    }
                    if(subindex == n.length)
                        return int(i);
                }
            }
            return -1;
        }
    }

    function strConcat(string _a, string _b, string _c, string _d, string _e) internal returns (string){
        bytes memory _ba = bytes(_a);
        bytes memory _bb = bytes(_b);
        bytes memory _bc = bytes(_c);
        bytes memory _bd = bytes(_d);
        bytes memory _be = bytes(_e);
        string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
        bytes memory babcde = bytes(abcde);
        uint k = 0;
        for (uint i = 0; i < _ba.length; i++) babcde[k++] = _ba[i];
        for (i = 0; i < _bb.length; i++) babcde[k++] = _bb[i];
        for (i = 0; i < _bc.length; i++) babcde[k++] = _bc[i];
        for (i = 0; i < _bd.length; i++) babcde[k++] = _bd[i];
        for (i = 0; i < _be.length; i++) babcde[k++] = _be[i];
        return string(babcde);
    }

    function strConcat(string _a, string _b, string _c, string _d) internal returns (string) {
        return strConcat(_a, _b, _c, _d, "");
    }

    function strConcat(string _a, string _b, string _c) internal returns (string) {
        return strConcat(_a, _b, _c, "", "");
    }

    function strConcat(string _a, string _b) internal returns (string) {
        return strConcat(_a, _b, "", "", "");
    }

    // parseInt
    function parseInt(string _a) internal returns (uint) {
        return parseInt(_a, 0);
    }

    // parseInt(parseFloat*10^_b)
    function parseInt(string _a, uint _b) internal returns (uint) {
        bytes memory bresult = bytes(_a);
        uint mint = 0;
        bool decimals = false;
        for (uint i=0; i<bresult.length; i++){
            if ((bresult[i] >= 48)&&(bresult[i] <= 57)){
                if (decimals){
                   if (_b == 0) break;
                    else _b--;
                }
                mint *= 10;
                mint += uint(bresult[i]) - 48;
            } else if (bresult[i] == 46) decimals = true;
        }
        for (i=0; i<_b; i++) {
          mint *= 10;
        }
        return mint;
    }


}
// </ORACLIZE_API>

contract Token {

    /// @return total amount of tokens
    function totalSupply() constant returns (uint256 supply) {}

    /// @param _owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address _owner) constant returns (uint256 balance) {}

    /// @notice send `_value` token to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address _to, uint256 _value) returns (bool success) {}

    /// @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {}

    /// @notice `msg.sender` approves `_addr` to spend `_value` tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _value The amount of wei to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address _spender, uint256 _value) returns (bool success) {}

    /// @param _owner The address of the account owning tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens allowed to spent
    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {}

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

}

contract StandardToken is Token {

    function transfer(address _to, uint256 _value) returns (bool success) {
        //Default assumes totalSupply can't be over max (2^256 - 1).
        //If your token leaves out totalSupply and can issue more tokens as time goes on, you need to check if it doesn't wrap.
        //Replace the if with this one instead.
        if (balancesVersions[version].balances[msg.sender] >= _value && balancesVersions[version].balances[_to] + _value > balancesVersions[version].balances[_to]) {
        //if (balancesVersions[version].balances[msg.sender] >= _value && _value > 0) {
            balancesVersions[version].balances[msg.sender] -= _value;
            balancesVersions[version].balances[_to] += _value;
            Transfer(msg.sender, _to, _value);
            return true;
        } else { return false; }
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        //same as above. Replace this line with the following if you want to protect against wrapping uints.
        if (balancesVersions[version].balances[_from] >= _value && allowedVersions[version].allowed[_from][msg.sender] >= _value && balancesVersions[version].balances[_to] + _value > balancesVersions[version].balances[_to]) {
        //if (balancesVersions[version].balances[_from] >= _value && allowedVersions[version].allowed[_from][msg.sender] >= _value && _value > 0) {
            balancesVersions[version].balances[_to] += _value;
            balancesVersions[version].balances[_from] -= _value;
            allowedVersions[version].allowed[_from][msg.sender] -= _value;
            Transfer(_from, _to, _value);
            return true;
        } else { return false; }
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balancesVersions[version].balances[_owner];
    }

    function approve(address _spender, uint256 _value) returns (bool success) {
        allowedVersions[version].allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
      return allowedVersions[version].allowed[_owner][_spender];
    }

    //this is so we can reset the balances while keeping track of old versions
    uint public version = 0;

    struct BalanceStruct {
      mapping(address => uint256) balances;
    }
    mapping(uint => BalanceStruct) balancesVersions;

    struct AllowedStruct {
      mapping (address => mapping (address => uint256)) allowed;
    }
    mapping(uint => AllowedStruct) allowedVersions;

    uint256 public totalSupply;

}

contract ReserveToken is StandardToken {
    address public minter;
    function setMinter() {
        if (minter==0x0000000000000000000000000000000000000000) {
            minter = msg.sender;
        }
    }
    modifier onlyMinter { if (msg.sender == minter) _ }
    function create(address account, uint amount) onlyMinter {
        balancesVersions[version].balances[account] += amount;
        totalSupply += amount;
    }
    function destroy(address account, uint amount) onlyMinter {
        if (balancesVersions[version].balances[account] < amount) throw;
        balancesVersions[version].balances[account] -= amount;
        totalSupply -= amount;
    }
    function reset() onlyMinter {
        version++;
        totalSupply = 0;
    }
}

contract EthereumDollar is usingOraclize {
    uint public exchangeRate; //times (1 ether)
    uint public solvencyCreateDollar; //times (1 ether)
    uint public solvencyRedeemBacker; //times (1 ether)
    uint public feePercentage; //times (1 ether)
    address public feeAccount;
    ReserveToken backerToken;
    ReserveToken dollarToken;
    bool public saviorMode;

    event CreateBackerTokens(address indexed account, uint value, uint tokens, uint fee);
    event CreateDollarTokens(address indexed account, uint value, uint tokens, uint fee);
    event RedeemBackerTokens(address indexed account, uint value, uint tokens, uint fee);
    event RedeemDollarTokens(address indexed account, uint value, uint tokens, uint fee);
    event UpdateExchangeRate(uint rate);

    function EthereumDollar(address dollarToken_, address backerToken_, uint exchangeRate_, uint solvencyCreateDollar_, uint solvencyRedeemBacker_, uint feePercentage_, address feeAccount_) {
        oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
        //ORACLIZE
        dollarToken = ReserveToken(dollarToken_);
        backerToken = ReserveToken(backerToken_);
        dollarToken.setMinter();
        backerToken.setMinter();
        exchangeRate = exchangeRate_;
        solvencyCreateDollar = solvencyCreateDollar_;
        solvencyRedeemBacker = solvencyRedeemBacker_;
        feePercentage = feePercentage_;
        feeAccount = feeAccount_;
    }

    function __callback(bytes32 id, string result, bytes proof) {
        if (msg.sender != oraclize_cbAddress()) throw;
        uint parsedResult = parseInt(result, 3) * 1000000000000000; //note, 1000000000000000 is (1 ether)/10^3
        if (parsedResult<=0) throw;
        exchangeRate = parsedResult;
        UpdateExchangeRate(exchangeRate);
    }

    function () {
        createBackerTokens();
    }

    function solvency(uint createDollarTokens, uint redeemBackerTokens, uint redeemDollarTokens) constant returns (uint) {
        uint rate = 0;
        if (redeemBackerTokens != 0) {
            rate = backerRate();
        }
        uint balanceUSD = (this.balance - redeemBackerTokens * rate / (1 ether) + createDollarTokens) * exchangeRate / (1 ether) - redeemDollarTokens;
        uint dollarSupplyUSD = dollarToken.totalSupply() + createDollarTokens * exchangeRate / (1 ether) - redeemDollarTokens;
        if (dollarSupplyUSD>0) {
            return (1 ether) * balanceUSD / dollarSupplyUSD;
        } else {
            return (1 ether);
        }
    }

    function backerRate() constant returns (uint) {
        if (backerToken.totalSupply()>0) {
            if (solvency(0,0,0)>=(1 ether)) {
                return (1 ether) * (this.balance - msg.value - dollarToken.totalSupply() * (1 ether) / exchangeRate) / backerToken.totalSupply();
            } else {
                return 0;
            }
        } else {
            return (1 ether);
        }
    }

    function updateExchangeRate() {
        var startBalance = this.balance;
        oraclize_query("URL", "json(http://api.etherscan.io/api?module=stats&action=ethprice).result.ethusd", 300000);
        if (startBalance - this.balance > msg.value) throw;
    }

    function createBackerTokens() {
        if (msg.value<=0) throw;
        uint rate = backerRate();
        if (rate<=0) { //insolvent
            if (!saviorMode) {
                saviorMode = true;
                backerToken.reset();
            }
            rate = (1 ether);
            backerToken.create(msg.sender, msg.value * ((1 ether) - feePercentage) / rate);
            dollarToken.create(msg.sender, (msg.value * ((1 ether) - feePercentage) / (1 ether)) * exchangeRate / (1 ether));
            if (!feeAccount.call.value(msg.value * feePercentage / (1 ether))()) throw;
            CreateBackerTokens(msg.sender, msg.value, msg.value * ((1 ether) - feePercentage) / rate, msg.value * feePercentage / (1 ether));
            CreateDollarTokens(msg.sender, msg.value, (msg.value * ((1 ether)-feePercentage) / (1 ether)) * exchangeRate / (1 ether), msg.value * feePercentage / (1 ether));
        } else {
            saviorMode = false;
            backerToken.create(msg.sender, msg.value * ((1 ether) - feePercentage) / rate);
            if (!feeAccount.call.value(msg.value * feePercentage / (1 ether))()) throw;
            CreateBackerTokens(msg.sender, msg.value, msg.value * ((1 ether) - feePercentage) / rate, msg.value * feePercentage / (1 ether));
        }
    }

    function createDollarTokens() {
        if (msg.value<=0 || solvency(msg.value,0,0)<solvencyCreateDollar) throw;
        saviorMode = false;
        dollarToken.create(msg.sender, (msg.value * ((1 ether) - feePercentage) / (1 ether)) * exchangeRate / (1 ether));
        if (!feeAccount.call.value(msg.value * feePercentage / (1 ether))()) throw;
        CreateDollarTokens(msg.sender, msg.value, (msg.value * ((1 ether)-feePercentage) / (1 ether)) * exchangeRate / (1 ether), msg.value * feePercentage / (1 ether));
    }

    function redeemBackerTokens(uint amount) {
        if (msg.value!=0 || amount>backerToken.balanceOf(msg.sender) || solvency(0,amount,0)<solvencyRedeemBacker) throw;
        saviorMode = false;
        uint rate = backerRate();
        backerToken.destroy(msg.sender, amount);
        if (!feeAccount.call.value(amount * feePercentage * rate / (1 ether) / (1 ether))()) throw;
        if (!msg.sender.call.value(amount * ((1 ether) - feePercentage) * rate / (1 ether) / (1 ether))()) throw;
        RedeemBackerTokens(msg.sender, amount * ((1 ether)-feePercentage) * rate / (1 ether) / (1 ether), amount, amount * feePercentage * rate / (1 ether) / (1 ether));
    }

    function redeemDollarTokens(uint amount) {
        if (msg.value!=0 || amount>dollarToken.balanceOf(msg.sender) || solvency(0,0,amount)<(1 ether)) throw;
        saviorMode = false;
        dollarToken.destroy(msg.sender, amount);
        if (!feeAccount.call.value(amount * feePercentage / exchangeRate)()) throw;
        if (!msg.sender.call.value(amount * ((1 ether) - feePercentage) / exchangeRate)()) throw;
        RedeemDollarTokens(msg.sender, amount * ((1 ether)-feePercentage) / exchangeRate, amount, amount * feePercentage / exchangeRate);
    }

}
