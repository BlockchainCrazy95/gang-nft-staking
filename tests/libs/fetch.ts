import {
    PublicKey
} from "@solana/web3.js";

import * as anchor from "@project-serum/anchor";
import { DaonftStaking } from "../../target/types/daonft_staking";
import { IdlAccounts } from "@project-serum/anchor";

const program = anchor.workspace.DaonftStaking as anchor.Program<DaonftStaking>;

export const fetchData = async(type:string, key:PublicKey) => {
    return await program.account[type].fetchNullable(key);
};

export const fetchGlobalState = async(
    key: PublicKey
): Promise<IdlAccounts<DaonftStaking>["globalState"] | null> => {
    return await fetchData("globalState", key);
}

export const fetchUserState = async(
    key: PublicKey
): Promise<IdlAccounts<DaonftStaking>["userState"] | null> => {
    return await fetchData("userState", key);
}