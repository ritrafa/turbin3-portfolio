use bs58;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{signature::Signer, signer::keypair::read_keypair_file};

use std::io::{self, BufRead};

pub fn airdrop() {
    let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");
    let client = RpcClient::new("https://api.devnet.solana.com");
    match client.request_airdrop(&keypair.pubkey(), 2_000_000_000) {
        Ok(s) => println!("Airdrop success! TX: {}", s),
        Err(e) => println!("Error: {}", e),
    }
}

pub fn base58_to_wallet() {
    let stdin = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");
    println!("{:?}", stdin.to_bytes());
    println!("{:?}", bs58::encode(stdin.to_bytes()).into_string());
    //let base58 = stdin.lock().lines().next().unwrap().unwrap();
    //let wallet = bs58::decode(base58).into_vec().unwrap();
    //println!("{:?}", wallet);
}

pub fn wallet_to_base58() {
    let stdin = io::stdin();
    let wallet = stdin
        .lock()
        .lines()
        .next()
        .unwrap()
        .unwrap()
        .trim()
        .split(',')
        .map(|s| s.trim().parse::<u8>().unwrap())
        .collect::<Vec<u8>>();
    let base58 = bs58::encode(wallet).into_string();
    println!("{:?}", base58);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_airdrop() {
        airdrop();
    }

    #[test]
    fn test_base58_to_wallet() {
        base58_to_wallet();
    }

    #[test]
    fn test_wallet_to_base58() {
        wallet_to_base58();
    }
}
