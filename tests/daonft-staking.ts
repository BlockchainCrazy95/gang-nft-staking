import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction
} from "@solana/web3.js";
import { DaonftStaking } from "../target/types/daonft_staking";
import { User } from "./libs/user";
import * as keys from "./libs/keys";
import {
  claimReward,
  depositReward,
  initializeProgram, stakeNft, unstakeNft
} from "./libs/instructions";
import { mintNewNFT } from "./libs/nft/mint";
import { createAssociatedTokenAccount, createMint, createTransferInstruction, getAssociatedTokenAddress, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("daonft-staking", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DaonftStaking as Program<DaonftStaking>;

  const admin = new User();
  const nftCreator = new User();
  const tokenCreator = new User();
  const user1 = new User();
  const user2 = new User();
  const user3 = new User();
  let user1_nft = [];
  let user2_nft = [];
  let user3_nft = [];

  let tokenMintKey;
    
  const mintToken = async (user:User, amount: number) => {
    // const globalStateKey = await keys.getGlobalStateKey();
    // console.log("mintToken tokenMintKey =", tokenMintKey);
    try {
      const userTokenAta = await createAssociatedTokenAccount(
        provider.connection,
        user.keypair,
        tokenMintKey,
        user.publicKey
      );
  
      // console.log("mintToken poolTokenAta=", userTokenAta)
    
      await mintTo(
        provider.connection,
        tokenCreator.keypair,
        tokenMintKey,
        userTokenAta,
        tokenCreator.publicKey,
        amount
      )

      let _balance = await provider.connection.getTokenAccountBalance(userTokenAta);
      console.log("pool token balance:", _balance);
    } catch(err) {
      console.log("mintToken err:", err);
    }

  }

  it("Setup", async() => {
    await admin.init(provider);
    await nftCreator.init(provider);
    await tokenCreator.init(provider);
    await user1.init(provider);
    await user2.init(provider);
    await user3.init(provider);

    tokenMintKey = await createMint(
      provider.connection,
      tokenCreator.keypair,
      tokenCreator.publicKey,
      null,
      0
    );
    
    // console.log("tokenMintKey =", tokenMintKey);

    // transfer GANG token
    // console.log("before mintToken tokenCreator=", tokenCreator.publicKey);
    await mintToken(admin, 10000);
    // console.log("token minted to admin")
    // const globalStateKey = await keys.getGlobalStateKey();
    // const transaction = new Transaction();
    // transaction.add(
    //   await createTransferInstruction(
    //     admin.publicKey,        
    //     user1.publicKey,
    //     admin.publicKey,
    //     1500
    //   )
    // );
    // const txHash = await sendAndConfirmTransaction(
    //   provider.connection,
    //   transaction,
    //   [admin.keypair]
    // )

    // console.log("token transfer txHash =", txHash);


    for (let i = 0;i<4;i++) {
      user1_nft.push(await mintNewNFT(
        provider.connection,
        nftCreator.keypair,
        user1
      ));
    }
    // console.log("user1_nft:", user1_nft)

    // for (let i = 0;i<3;i++) {
    //   user2_nft.push(await mintNewNFT(
    //     provider.connection,
    //     nftCreator.keypair,
    //     user2
    //   ));
    // }
    // console.log("user2_nft:", user1_nft)

    // for (let i = 0;i<4;i++) {
    //   user3_nft.push(await mintNewNFT(
    //     provider.connection,
    //     nftCreator.keypair,
    //     user3
    //   ));
    //  console.log("user3_nft:", user1_nft)
    // }
  })

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await initializeProgram(admin, nftCreator, tokenMintKey);
    console.log("initializeProgram txHash =", tx);
  });

  it("deposit reward", async () => {
    const userTokenAta = await getAssociatedTokenAddress(
      tokenMintKey,
      admin.publicKey
    );
    await depositReward(admin, tokenMintKey);
    let _balance = await provider.connection.getTokenAccountBalance(userTokenAta);
    console.log("admin token balance:", _balance);
    // assert.ok(Number(_balance))

  })

  it("Stake NFT", async () => {
    await stakeNft(user1, user1_nft[0]);
    await stakeNft(user1, user1_nft[1]);
    await stakeNft(user1, user1_nft[2]);
    await stakeNft(user1, user1_nft[3]);
  });

  it("Claim Reward", async () => {
    await claimReward(user1, tokenMintKey);
  });

  it("Unstake NFT", async () => {
    await unstakeNft(user1, user1_nft[2]);
    await claimReward(user1, tokenMintKey);
  });

});
