// Contents: keygen function to generate a new Solana wallet
use solana_sdk::signature::{Keypair, Signer};

// Prints a new Solana wallet and its private key
pub fn _keygen() -> Keypair {
    let kp = Keypair::new();
    println!("New Solana wallet created: {}", kp.pubkey());
    println!("Save the following private key into a JSON file:");
    println!("{:?}", kp.to_bytes());
    kp
}
