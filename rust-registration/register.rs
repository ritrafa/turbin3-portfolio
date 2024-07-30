mod programs;

use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    signature::{read_keypair_file, Signer},
    system_program,
};

use crate::register::programs::wba_prereq::{CompleteArgs, WbaPrereqProgram};

pub fn submit_completion() {
    // Read WBA wallet private key
    let signer = read_keypair_file("../wba-wallet.json").expect("Couldn't find WBA wallet file");

    // Set up Solana Devnet RPC client
    let rpc_client = RpcClient::new("https://api.devnet.solana.com");

    // Define instruction data
    let github_account = "ritrafa"; // Replace with your GitHub username
    let github_bytes = github_account.as_bytes().to_vec();

    // Create a PDA (Program Derived Address) for the prerequisite account
    let prereq =
        WbaPrereqProgram::derive_program_address(&[b"prereq", signer.pubkey().to_bytes().as_ref()]);

    let args = CompleteArgs {
        github: github_bytes,
    };

    // Get the recent blockhash
    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .expect("Failed to get recent blockhash");

    // Create the complete instruction
    let transaction = WbaPrereqProgram::complete(
        &[&signer.pubkey(), &prereq, &system_program::id()],
        &args,
        Some(&signer.pubkey()),
        &[&signer],
        recent_blockhash,
    );

    // Send the transaction and print the result
    match rpc_client.send_and_confirm_transaction(&transaction) {
        Ok(signature) => println!("Transaction successful! Signature: {}", signature),
        Err(e) => println!("Transaction failed: {}", e),
    }
}
