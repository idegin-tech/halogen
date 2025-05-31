"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AuthState = {};

interface AuthContextInterface {
    state: AuthState;
    updateAuthState: (updates: Partial<AuthState>) => void;
}

const AuthContext = createContext<AuthContextInterface | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({});

    const updateAuthState = (updates: Partial<AuthState>) => {
        setState((prevState) => ({ ...prevState, ...updates }));
    };

    useEffect(() => {
        const refreshToken = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error('Failed to refresh token');
                }
            } catch (error) {
                console.error('Error refreshing token:', error);
            }
        };

        const timeoutId = setTimeout(() => {
            refreshToken();
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, []);

    const contextValue: AuthContextInterface = {
        state,
        updateAuthState,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}