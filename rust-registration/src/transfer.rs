use solana_client::rpc_client::RpcClient;
use solana_program::{pubkey::Pubkey, system_instruction::transfer};
use solana_sdk::{
    message::Message, signature::Signer, signer::keypair::read_keypair_file, system_instruction,
    transaction::Transaction,
};
use std::str::FromStr;

pub fn _transfer_sol() {
    let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");
    let to_pubkey = Pubkey::from_str("rafaQ56aFGU1raFoagEzCyKsQdiMUhJyCNzje6oduTv").unwrap();
    let client = RpcClient::new("https://api.devnet.solana.com");
    let recent_blockhash = client
        .get_latest_blockhash()
        .expect("Failed to get blockhash");
    let transaction = Transaction::new_signed_with_payer(
        &[transfer(&keypair.pubkey(), &to_pubkey, 100_000_000)],
        Some(&keypair.pubkey()),
        &[&keypair],
        recent_blockhash,
    );
    let signature = client
        .send_and_confirm_transaction(&transaction)
        .expect("Transaction failed");
    println!("TX: {}", signature);
}

pub fn _transfer_all_sol_to_wba() {
    let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");
    let wba_pubkey = Pubkey::from_str("rafaQ56aFGU1raFoagEzCyKsQdiMUhJyCNzje6oduTv").unwrap();
    let rpc_client = RpcClient::new("https://api.devnet.solana.com");

    // Get the balance of the Devnet wallet
    let balance = rpc_client
        .get_balance(&keypair.pubkey())
        .expect("Failed to get balance");

    // Get recent blockhash
    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .expect("Failed to get recent blockhash");

    // Calculate fee for the transaction
    let fee = rpc_client
        .get_fee_for_message(&Message::new_with_blockhash(
            &[system_instruction::transfer(
                &keypair.pubkey(),
                &wba_pubkey,
                balance,
            )],
            Some(&keypair.pubkey()),
            &recent_blockhash,
        ))
        .expect("Failed to get fee");

    // Transfer the remaining balance minus the fee
    let amount_to_transfer = balance - fee;

    if amount_to_transfer > 0 {
        let transaction = Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &keypair.pubkey(),
                &wba_pubkey,
                amount_to_transfer,
            )],
            Some(&keypair.pubkey()),
            &[&keypair],
            recent_blockhash,
        );

        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");

        println!("Transaction successful! Signature: {}", signature);
    } else {
        println!("Not enough SOL to cover the fee.");
    }
}
