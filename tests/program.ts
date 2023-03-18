import * as anchor from "@project-serum/anchor";
import { DaonftStaking } from "../target/types/daonft_staking";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.DaonftStaking as anchor.Program<DaonftStaking>;

export const getProgram = () => {
    return program;
}