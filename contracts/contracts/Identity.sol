pragma solidity ^0.5.1;

import "./ERC725.sol";
contract Identity is ERC725 {
    event ContractCreation(address newContract);

    uint256 constant OPERATION_CALL = 0;
    uint256 constant OPERATION_CREATE = 1;
    bytes32 constant KEY_OWNER = 0x0000000000000000000000000000000000000000000000000000000000000000;

    mapping(bytes32 => bytes32) store;
    bool initialized;

    function initialize(bytes32 ownerHash) public {
        require(!initialized, "contract-already-initialized");
        initialized = true;
        store[KEY_OWNER] = ownerHash;
    }

    modifier onlyOwner() {
        require(keccak256(abi.encodePacked(msg.sender)) == store[KEY_OWNER], "only-owner-allowed");
        _;
    }

    function getData(bytes32 _key) external view returns (bytes32 _value) {
        return store[_key];
    }

    function setData(bytes32 _key, bytes32 _value) external onlyOwner {
        store[_key] = _value;
        emit DataSet(_key, _value);
    }

    function execute(uint256 _operationType, address _to, uint256 _value, bytes calldata _data) external onlyOwner {
        if (_operationType == OPERATION_CALL) {
            executeCall(_to, _value, _data);
        } else if (_operationType == OPERATION_CREATE) {
            address newContract = executeCreate(_data);
            emit ContractCreation(newContract);
        } else {
            // We don't want to spend users gas if parametar is wrong
            revert();
        }
    }

    // copied from GnosisSafe
    // https://github.com/gnosis/safe-contracts/blob/v0.0.2-alpha/contracts/base/Executor.sol
    function executeCall(address to, uint256 value, bytes memory data)
        internal
        returns (bool success)
    {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    // copied from GnosisSafe
    // https://github.com/gnosis/safe-contracts/blob/v0.0.2-alpha/contracts/base/Executor.sol
    function executeCreate(bytes memory data)
        internal
        returns (address newContract)
    {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            newContract := create(0, add(data, 0x20), mload(data))
        }
    }

    function () external payable {}
}
