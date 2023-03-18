import * as anchor from "@project-serum/anchor";

import {
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    sendAndConfirmTransaction
} from "@solana/web3.js";

import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

import { DaonftStaking } from "../../target/types/daonft_staking";
import { User } from "./user";
import * as keys from "./keys";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { fetchUserState } from "./fetch";

const program = anchor.workspace.DaonftStaking as anchor.Program<DaonftStaking>

export const initializeProgram = async(admin: User, nftCreator: User, tokenMint: PublicKey) => {
    let globalStateKey = await keys.getGlobalStateKey();
    let rewardVault = await keys.getPoolKey(tokenMint);
    return await program.methods
        .initialize(admin.publicKey, nftCreator.publicKey)
        .accounts({
            authority: admin.publicKey,
            rewardMint: tokenMint,
            rewardVault,
            globalState: globalStateKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        })
        .signers([admin.keypair])
        .rpc(); 
}

export const createUserStateInstruction = async (
    payer: User,
    userKey: PublicKey,
    userStateKey: PublicKey
) => {
    return await program.methods
        .initUserState(userKey)
        .accounts({
            payer: payer.publicKey,
            userState: userStateKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        })
        .instruction();
};

export const stakeNft = async(user: User, nftMint: PublicKey) => {
    const globalStateKey = await keys.getGlobalStateKey();
    const userStateKey = await keys.getUserStateKey(user.publicKey);
    const poolNftAta = await getAssociatedTokenAddress(
        nftMint,
        globalStateKey,
        true
    );
    const userNftAta = await getAssociatedTokenAddress(
        nftMint,
        user.publicKey
    );
    const transaction = new Transaction();

    if(!(await program.provider.connection.getAccountInfo(poolNftAta))) {
        transaction.add(await createAssociatedTokenAccountInstruction(
            user.publicKey,
            poolNftAta,
            globalStateKey,
            nftMint
        ));
    }

    if(!(await fetchUserState(userStateKey))) {
        transaction.add(await createUserStateInstruction(user, user.publicKey, userStateKey));
    }

    const metadataKey = await keys.getMetadataKey(nftMint);
    let metadata_info = Metadata.fromAccountInfo(await program.provider.connection.getAccountInfo(metadataKey))[0];
    // console.log("metadata_info:", metadata_info);

    transaction.add(await program.methods
        .stakeNft()
        .accounts({
            user: user.publicKey,
            globalState: globalStateKey,
            userState: userStateKey,
            poolNftAta,
            userNftAta,
            nftMint,
            nftMetadata: metadataKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        })
        .signers([user.keypair])
        .instruction());
    const txHash = await sendAndConfirmTransaction(
        program.provider.connection,
        transaction,
        [user.keypair]
    );
    console.log("stakeNft txHash = ", txHash);
}

export const depositReward = async(user: User, tokenMint: PublicKey) => {
    const globalStateKey = await keys.getGlobalStateKey();
    const rewardVault = await keys.getPoolKey(tokenMint);

    let userTokenAta = await getAssociatedTokenAddress(
        tokenMint,
        user.publicKey
    );

    const transaction = new Transaction();
    transaction.add(await program.methods
        .depositReward(new anchor.BN(1200))
        .accounts({
            user: user.publicKey,
            globalState: globalStateKey,
            rewardVault,
            userTokenAta,
            rewardMint: tokenMint,
            tokenProgram: TOKEN_PROGRAM_ID
        }).signers([user.keypair]).instruction()
    )
    const txHash = await sendAndConfirmTransaction(
        program.provider.connection,
        transaction,
        [user.keypair]
    )
    console.log("depositReward txHash =", txHash);
}

export const claimReward = async (user: User, tokenMint: PublicKey) => {
    const globalStateKey = await keys.getGlobalStateKey();
    const userStateKey = await keys.getUserStateKey(user.publicKey);
    const rewardVault = await keys.getPoolKey(tokenMint);
    const userTokenAta = await getAssociatedTokenAddress(
        tokenMint,
        user.publicKey
    );
    
    const transaction = new Transaction();
    
    if(!(await program.provider.connection.getAccountInfo(userTokenAta))) {
        transaction.add(await createAssociatedTokenAccountInstruction(
            user.publicKey,
            userTokenAta,
            user.publicKey,
            tokenMint
        ))
    }

    if(!(await fetchUserState(userStateKey))) {
        transaction.add(await createUserStateInstruction(user, user.publicKey, userStateKey));
    }
    transaction.add(await program.methods
        .claimReward()
        .accounts({
            user: user.publicKey,
            globalState: globalStateKey,
            userState: userStateKey,
            rewardVault,
            userTokenAta,
            rewardMint: tokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        })
        .signers([user.keypair])
        .instruction()
    );
    console.log("after add tx")
    try {
        const txHash = await sendAndConfirmTransaction(
            program.provider.connection,
            transaction,
            [user.keypair]
        );
        console.log("claimReward txHash =", txHash);
        
        let _balance = await program.provider.connection.getTokenAccountBalance(userTokenAta);
        console.log("admin token balance:", _balance);
    } catch(err) {
        console.log("err:", err);
    }
}

export const unstakeNft = async(user: User, nftMint: PublicKey) => {
    const globalStateKey = await keys.getGlobalStateKey();
    const userStateKey = await keys.getUserStateKey(user.publicKey);
    const poolNftAta = await getAssociatedTokenAddress(
        nftMint,
        globalStateKey,
        true
    );
    const userNftAta = await getAssociatedTokenAddress(
        nftMint,
        user.publicKey
    );

    const transaction = new Transaction();

    if(!(await program.provider.connection.getAccountInfo(poolNftAta))) {
        throw new Error("no nft in pool");
    }

    if(!(await fetchUserState(userStateKey))) {
        throw new Error("you didn't stake that nft");
    }

    transaction.add(await program.methods
        .unstakeNft()
        .accounts({
            user: user.publicKey,
            globalState: globalStateKey,
            userState: userStateKey,
            poolNftAta,
            userNftAta,
            nftMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([user.keypair])
        .instruction()
    );
    console.log("here")
    try {
        const txHash = await sendAndConfirmTransaction(
            program.provider.connection,
            transaction,
            [user.keypair]
        );
        console.log("unstakeNft txHash =", txHash);
    } catch(err) {
        console.log("err:", err);
    }
    
}