import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign up new user
    const signup = async (email, password, profileData) => {
        try {
            // Create Firebase auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, {
                displayName: profileData.name
            });

            // Create user profile in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                name: profileData.name,
                phone: profileData.phone || '',
                nationality: profileData.nationality || '',
                aadhaarNumber: profileData.aadhaarNumber || '',
                emergencyContact: profileData.emergencyContact || '',
                walletAddress: null,
                photoURL: user.photoURL || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return user;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    // Login existing user
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
            setUserProfile(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    // Update user profile
    const updateUserProfile = async (updates) => {
        if (!currentUser) throw new Error('No user logged in');

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });

            // Refresh user profile
            await fetchUserProfile(currentUser.uid);
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    };

    // Connect wallet to user profile
    const connectWallet = async (walletAddress) => {
        if (!currentUser) throw new Error('No user logged in');

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                walletAddress: walletAddress,
                walletConnectedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Refresh user profile
            await fetchUserProfile(currentUser.uid);
        } catch (error) {
            console.error('Connect wallet error:', error);
            throw error;
        }
    };

    // Upload profile photo
    const uploadProfilePhoto = async (file) => {
        if (!currentUser) throw new Error('No user logged in');

        try {
            const storageRef = ref(storage, `profile_photos/${currentUser.uid}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);

            // Update Firebase auth profile
            await updateProfile(currentUser, { photoURL });

            // Update Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                photoURL: photoURL,
                updatedAt: new Date().toISOString()
            });

            // Refresh user profile
            await fetchUserProfile(currentUser.uid);

            return photoURL;
        } catch (error) {
            console.error('Upload photo error:', error);
            throw error;
        }
    };

    // Fetch user profile from Firestore
    const fetchUserProfile = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                setUserProfile(userDoc.data());
                return userDoc.data();
            } else {
                console.error('User profile not found');
                setUserProfile(null);
                return null;
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            setUserProfile(null);
            return null;
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    await fetchUserProfile(user.uid);
                } catch (e) {
                    console.error("Auth state change error:", e);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        signup,
        login,
        logout,
        updateUserProfile,
        connectWallet,
        uploadProfilePhoto,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
