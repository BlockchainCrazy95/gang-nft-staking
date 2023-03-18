import {
    web3
} from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";

import {
    Connection,
    PublicKey,
    Signer,
    Transaction,
    sendAndConfirmTransaction
} from "@solana/web3.js";

export const airdropSol = async (connection: Connection, target: web3.PublicKey, lamps: number):Promise<string> => {
    const sig: string = await connection.requestAirdrop(target, lamps);
    await connection.confirmTransaction(sig);
    return sig;
}

export const createAta = async (
    connection: Connection,
    payer: Signer,
    mint: PublicKey,
    owner: PublicKey,
    curveOff: boolean = false
): Promise<PublicKey> => {
    const ataKey = await getAssociatedTokenAddress(mint, owner, curveOff);
    let ix = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ataKey,
        owner,
        mint
    );
    await sendAndConfirmTransaction(connection, new Transaction().add(ix), [
        payer,
    ]);
}