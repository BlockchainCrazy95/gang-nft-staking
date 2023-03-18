import {
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL,
    Connection,
} from "@solana/web3.js";

import {
    createMint
} from "@solana/spl-token";

import { USDC_DECIMALS } from "./constants";
import * as keys from "./keys";
import { airdropSol } from "../utils";

export class Accounts {
    saleMint: PublicKey;
    payerAndAuth: Keypair;
    globalStateKey: PublicKey;
    nftCreator: Keypair;
    
    constructor() {
        this.payerAndAuth = Keypair.generate();
        this.nftCreator = Keypair.generate();
    }

    async init(connection: Connection) {
        this.globalStateKey = await keys.getGlobalStateKey();
        await airdropSol(
            connection,
            this.payerAndAuth.publicKey,
            99999 * LAMPORTS_PER_SOL
        );
        await airdropSol(
            connection,
            this.nftCreator.publicKey,
            99999 * LAMPORTS_PER_SOL
        );
        this.saleMint = await createMint(
            connection,
            this.payerAndAuth,
            this.payerAndAuth.publicKey,
            null,
            USDC_DECIMALS
        );
        
        
    }
}