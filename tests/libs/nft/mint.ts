import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
} from "@solana/web3.js";

import {
    createMint,
    createAssociatedTokenAccount,
    mintTo
} from "@solana/spl-token";

import { User } from "../user";
import { createMetadata, Creator, Data } from "../nft/metadata";

export const mintNewNFT = async(
    connection: Connection,
    creator: Keypair,
    owner: User
):Promise<PublicKey> => {
    // console.log("mintNewNFT: owner=", owner.publicKey);
    const newMintKey = await createMint(
        connection,
        creator,
        creator.publicKey,
        null,
        0
    );
    // console.log("newMintKey =", newMintKey);

    const nftAccount = await createAssociatedTokenAccount(
        connection,
        owner.keypair,
        newMintKey,
        owner.publicKey
    );
    // console.log("nftAccount =", nftAccount);

    await mintTo(
        connection,
        owner.keypair,
        newMintKey,
        nftAccount,
        creator,
        1
    );
    // console.log("MintTo passed");

    let name = "OGLabz DAO NFT #" + Number(Math.random() * 100000 % 9999).toFixed(0);
    const metadataUrl = "https://oglabz.io/metadata/testnft";

    const creators = [
        new Creator({
            address: creator.publicKey.toBase58(),
            share: 80,
            verified: true
        }),
        new Creator({
            address: "7diGCKfWSnqujiC9GvK3mpwsF5421644SbDEHKtSho1d",
            share: 20,
            verified: false
        })
    ];

    let data = new Data({
        name: name,
        symbol: "OGDAO",
        uri: metadataUrl,
        creators,
        sellerFeeBasisPoints: 800,
    });

    let instructions: TransactionInstruction[] = [];

    await createMetadata(
        data,
        creator.publicKey.toBase58(),
        newMintKey.toBase58(),
        creator.publicKey.toBase58(),
        instructions,
        creator.publicKey.toBase58()
    );
    // console.log("createMetadata passed")
    // console.log("instructions=", instructions)
    const transaction = new Transaction();
    transaction.add(...instructions);
    // console.log("transaction=", transaction)
    let txHash = await sendAndConfirmTransaction(
        connection,
        transaction,
        [creator]
    );
    console.log("mintNewNFT creator=", creator.publicKey.toString() , " txHash =", txHash);
    // console.log("mint nft done");
    return newMintKey;
}