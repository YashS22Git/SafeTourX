const algosdk = require('algosdk');

async function checkBalance() {
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
    const address = "BRZAIDE7N3PSAJMRDV7PYV5UBKMUR4QUPRL6LA3KCVU7ZOADP7CRYK44CA";

    try {
        const accountInfo = await algodClient.accountInformation(address).do();
        console.log(`Account: ${address}`);
        // Convert BigInt to string/number safely
        const amount = typeof accountInfo.amount === 'bigint' ? Number(accountInfo.amount) : accountInfo.amount;
        console.log(`Balance: ${amount} microAlgos (${amount / 1000000} ALGO)`);
    } catch (e) {
        console.error("Error fetching balance:", e.message);
    }
}

checkBalance();
