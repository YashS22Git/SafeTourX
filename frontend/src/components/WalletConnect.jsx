import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2 } from 'lucide-react';
import { PeraWalletConnect } from '@perawallet/connect';
import { useAuth } from '../contexts/AuthContext';

const peraWallet = new PeraWalletConnect();

const WalletConnect = ({ onConnect }) => {
    const { connectWallet: saveWalletToFirebase, userProfile } = useAuth();
    const [address, setAddress] = useState(null);

    useEffect(() => {
        // Load wallet from Firebase profile first
        if (userProfile?.walletAddress) {
            setAddress(userProfile.walletAddress);
            if (onConnect) onConnect(userProfile.walletAddress);
        }

        // Try to reconnect existing Pera session
        peraWallet.reconnectSession().then((accounts) => {
            if (accounts && accounts.length > 0) {
                const addr = accounts[0];
                console.log("Pera Wallet reconnected:", addr);
                setAddress(addr);
                if (onConnect) onConnect(addr);
            }
        }).catch((err) => {
            console.log("No existing Pera session:", err?.message || err);
            try { peraWallet.disconnect(); } catch (e) { }
        });

        // Handle disconnect event
        peraWallet.connector?.on('disconnect', () => {
            setAddress(null);
            if (onConnect) onConnect(null);
        });
    }, [userProfile]);

    const connectWalletHandler = async () => {
        try {
            // If already connected, disconnect first to get fresh session
            try { peraWallet.disconnect(); } catch (e) { }

            const accounts = await peraWallet.connect();
            if (accounts && accounts.length > 0) {
                const addr = accounts[0];
                console.log("Pera Wallet connected:", addr);
                setAddress(addr);
                if (onConnect) onConnect(addr);

                // Save to Firebase
                if (saveWalletToFirebase) {
                    try {
                        await saveWalletToFirebase(addr);
                        console.log("Wallet saved to Firebase profile");
                    } catch (err) {
                        console.error("Failed to save wallet to Firebase:", err);
                    }
                }
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);

            // Handle "Session currently connected"
            if (error?.message?.includes('Session currently connected') ||
                error?.message?.includes('session')) {
                try {
                    const accounts = await peraWallet.reconnectSession();
                    if (accounts && accounts.length > 0) {
                        const addr = accounts[0];
                        console.log("Pera Wallet recovered session:", addr);
                        setAddress(addr);
                        if (onConnect) onConnect(addr);
                        return;
                    }
                } catch (e) {
                    console.error("Could not recover session:", e);
                }
            }

            if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
                alert('Failed to connect wallet: ' + (error?.message || 'Unknown error'));
            }
        }
    };

    const disconnectWallet = () => {
        try { peraWallet.disconnect(); } catch (e) { }
        setAddress(null);
        if (onConnect) onConnect(null);
    };

    return (
        <button
            onClick={address ? disconnectWallet : connectWalletHandler}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium text-sm shadow-sm
            ${address ? 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-red-50' : 'bg-brand-600 text-white hover:bg-brand-700'}
        `}
        >
            {address ? (
                <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-mono text-xs">{address.substring(0, 6)}...{address.substring(address.length - 4)}</span>
                </>
            ) : (
                <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect Pera</span>
                </>
            )}
        </button>
    );
};

// Export peraWallet instance for use in other components
export { peraWallet };
export default WalletConnect;
