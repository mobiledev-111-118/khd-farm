const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const SoyToken = artifacts.require('SoyToken');
const CloStaking = artifacts.require('CloStaking');
const MockBEP20 = artifacts.require('libs/MockBEP20');
const WCLO = artifacts.require('libs/WCLO');

contract('CloStaking.......', async ([alice, bob, admin, dev, minter]) => {
  beforeEach(async () => {
    this.rewardToken = await SoyToken.new({ from: minter });
    this.lpToken = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.wCLO = await WCLO.new({ from: minter });
    this.cloChef = await CloStaking.new(
      this.wCLO.address,
      this.rewardToken.address,
      1000,
      10,
      1010,
      admin,
      this.wCLO.address,
      { from: minter }
    );
    await this.rewardToken.mint(this.cloChef.address, 100000, { from: minter });
  });

  it('deposit/withdraw', async () => {
    await time.advanceBlockTo('10');
    await this.cloChef.deposit({ from: alice, value: 100 });
    await this.cloChef.deposit({ from: bob, value: 200 });
    assert.equal(
      (await this.wCLO.balanceOf(this.cloChef.address)).toString(),
      '300'
    );
    assert.equal((await this.cloChef.pendingReward(alice)).toString(), '1000');
    await this.cloChef.deposit({ from: alice, value: 300 });
    assert.equal((await this.cloChef.pendingReward(alice)).toString(), '0');
    assert.equal((await this.rewardToken.balanceOf(alice)).toString(), '1333');
    await this.cloChef.withdraw('100', { from: alice });
    assert.equal(
      (await this.wCLO.balanceOf(this.cloChef.address)).toString(),
      '500'
    );
    await this.cloChef.emergencyRewardWithdraw(1000, { from: minter });
    assert.equal((await this.cloChef.pendingReward(bob)).toString(), '1399');
  });

  it('should block man who in blanklist', async () => {
    await this.cloChef.setBlackList(alice, { from: admin });
    await expectRevert(
      this.cloChef.deposit({ from: alice, value: 100 }),
      'in black list'
    );
    await this.cloChef.removeBlackList(alice, { from: admin });
    await this.cloChef.deposit({ from: alice, value: 100 });
    await this.cloChef.setAdmin(dev, { from: minter });
    await expectRevert(
      this.cloChef.setBlackList(alice, { from: admin }),
      'admin: wut?'
    );
  });

  it('emergencyWithdraw', async () => {
    await this.cloChef.deposit({ from: alice, value: 100 });
    await this.cloChef.deposit({ from: bob, value: 200 });
    assert.equal(
      (await this.wCLO.balanceOf(this.cloChef.address)).toString(),
      '300'
    );
    await this.cloChef.emergencyWithdraw({ from: alice });
    assert.equal(
      (await this.wCLO.balanceOf(this.cloChef.address)).toString(),
      '200'
    );
    assert.equal((await this.wCLO.balanceOf(alice)).toString(), '100');
  });

  it('emergencyRewardWithdraw', async () => {
    await expectRevert(
      this.cloChef.emergencyRewardWithdraw(100, { from: alice }),
      'caller is not the owner'
    );
    await this.cloChef.emergencyRewardWithdraw(1000, { from: minter });
    assert.equal((await this.rewardToken.balanceOf(minter)).toString(), '1000');
  });

  it('setLimitAmount', async () => {
    // set limit to 1e-12 CLO
    await this.cloChef.setLimitAmount('1000000', { from: minter });
    await expectRevert(
      this.cloChef.deposit({ from: alice, value: 100000000 }),
      'exceed the to'
    );
  });
});
