import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BidRush } from "../target/types/bid_rush";
import { expect } from "chai";

describe("bid_rush", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BidRush as Program<BidRush>;

  it("Initialise le contrat Bid-Rush", async () => {
    const stateKeypair = anchor.web3.Keypair.generate();

    await program.methods
      .initialize()
      .accounts({
        state: stateKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([stateKeypair])
      .rpc();

    const state = await program.account.contractState.fetch(stateKeypair.publicKey);
    expect(state.authority.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
    expect(state.auctionCount.toNumber()).to.equal(0);
  });
});
