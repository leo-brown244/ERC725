const { getEncodedCall, checkErrorRevert } = require('../helpers/utils');
const Identity = artifacts.require('Identity')
const Counter = artifacts.require('Counter')
const { keccak256 } = web3.utils;

const KEY_OWNER = '0x0000000000000000000000000000000000000000000000000000000000000000'
const OPERATION_CALL = 0

contract('Identity', function(accounts) {
  let identity, counter

  beforeEach(async function() {
    // Deploy contracts
    identity = await Identity.new()
    identity.initialize(keccak256(accounts[0]))
    counter = await Counter.new()
  })

  it('should allow the owner to call execute', async function() {
    // Counter should be 0 initially
    assert.equal((await counter.get()).toString(), '0')

    // Call counter.increment from identity
    const encodedCall = getEncodedCall(counter, 'increment')
    await identity.execute(OPERATION_CALL, counter.address, 0, encodedCall, { from: accounts[0] })

    // Check that increment was called
    assert.equal((await counter.get()).toString(), '1')
  })

  it('should not allow non-owner to call execute', async function() {
    // Counter should be 0 initially
    assert.equal((await counter.get()).toString(), '0')

    // Calling counter.increment from identity should fail
    const encodedCall = getEncodedCall(counter, 'increment')
    await checkErrorRevert(identity.execute(OPERATION_CALL, counter.address, 0, encodedCall, { from: accounts[1] }), 'only-owner-allowed');

    // Check that increment was not called
    assert.equal((await counter.get()).toString(), '0')
  })

  it('should recieve ether correctly', async () => {
    // Checking that balance of Identity contract is 0.
    const actualBalance = await web3.eth.getBalance(identity.address);
    assert.equal(actualBalance.toString(), '0');

    // Sending ether to the identity contract.
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: identity.address,
      value: web3.utils.toWei('1', 'ether')
    });

    // Check Identity contract has received the ether.
    var oneEthAmmount =  await web3.utils.toWei('1', 'ether');
    var identityBalance = await web3.eth.getBalance(identity.address);
    assert.equal(oneEthAmmount, identityBalance);
  })

  it('should allow owner to send ether', async() => {
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: identity.address,
      value: web3.utils.toWei('1', 'ether')
    });

    // We have 1 ether
    var oneEthAmmount =  await web3.utils.toWei('1', 'ether');
    const actualBalance = await web3.eth.getBalance(identity.address);
    assert.equal(actualBalance, oneEthAmmount)

    // Sending 1 ether
    await identity.execute(OPERATION_CALL, counter.address, web3.utils.toWei('1', 'ether'), "0x0")

    // We have 0 ether
    var zeroEthAmmount =  await web3.utils.toWei('0', 'ether');
    var identityBalance = await web3.eth.getBalance(identity.address);
    assert.equal(zeroEthAmmount, identityBalance);

    // contract recived 1 ether
    var counter_balance = await web3.eth.getBalance(counter.address);
    assert.equal(oneEthAmmount, counter_balance);
  })
})
