import { PublicKey } from "@solana/web3.js";
import {
    GLOBAL_STATE_SEED,
    USER_STATE_SEED,
    POOL_SEED,
    MetadataProgramId
} from "./constants";
import { getProgram } from "../program";

const program = getProgram();

export const getGlobalStateKey = async () => {
    const [ globalStateKey ] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_SEED)],
        program.programId
    );
    return globalStateKey;
}

export const getUserStateKey = async (userKey: PublicKey) => {
    const [ userStateKey ] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_STATE_SEED), userKey.toBuffer()],
        program.programId
    );
    return userStateKey;
}

export const getPoolKey = async (tokenMint: PublicKey) => {
    const [ poolKey ] = await PublicKey.findProgramAddress(
        [Buffer.from(POOL_SEED), tokenMint.toBuffer()],
        program.programId
    );
    return poolKey;
}

export const getMetadataKey = async (tokenMint: PublicKey): Promise<PublicKey> => {
    return (
        await PublicKey.findProgramAddress(
            [
                Buffer.from("metadata"),
                new PublicKey(MetadataProgramId).toBuffer(),
                tokenMint.toBuffer(),
            ],
            new PublicKey(MetadataProgramId)
        )
    )[0];
}
