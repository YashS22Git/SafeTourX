const algosdk = require('algosdk');

async function testTxn() {
    try {
        const algodToken = ''; // AlgoNode doesn't need token
        const algodServer = 'https://testnet-api.algonode.cloud';
        const algodPort = 443; // Use standard HTTPS port

        const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

        console.log("Getting params...");
        const suggestedParams = await algodClient.getTransactionParams().do();
        console.log("Params received (BigInts present)");

        const userAddress = "U3CXLXWDCXL2CGEJVTRDOIWWLJ4IUW5OMNGEYLHHIFKLVWJWM7BWFAHN4Q";
        const ESCROW_ADDRESS = "U3CXLXWDCXL2CGEJVTRDOIWWLJ4IUW5OMNGEYLHHIFKLVWJWM7BWFAHN4Q";
        const price = 0.5;
        const hotelId = "hotel_001";

        console.log("Creating transaction with object...");
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: userAddress,
            to: ESCROW_ADDRESS,
            amount: Math.round(price * 1000000),
            note: new Uint8Array(Buffer.from(`SafeTourX Booking: ${hotelId}`)),
            suggestedParams: suggestedParams
        });

        console.log("Transaction created successfully!");
        console.log("Base64:", Buffer.from(txn.toByte()).toString('base64'));

    } catch (error) {
        console.error("Error:", error);
    }
}

testTxn();
