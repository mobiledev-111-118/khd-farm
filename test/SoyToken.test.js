const { assert } = require("chai");

const SoyToken = artifacts.require('SoyToken');

contract('SoyToken', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.soy = await SoyToken.new({ from: minter });
    });


    it('mint', async () => {
        await this.soy.mint(alice, 1000, { from: minter });
        assert.equal((await this.soy.balanceOf(alice)).toString(), '1000');
    })
});
