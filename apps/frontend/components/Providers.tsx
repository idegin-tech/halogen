'use client'
import React from 'react'
import { Next13ProgressBar } from 'next13-progressbar';
import { AuthProvider } from '@/context/auth.context';

type Props = {
    children?: React.ReactNode;
}

export default function Providers({ children }: Props) {
    return (
        <>
            <AuthProvider>
                <Next13ProgressBar
                    height="4px"
                    color="var(--primary)"
                    options={{ showSpinner: true }}
                    showOnShallow
                />
                {children}
            </AuthProvider>
        </>
    )
}