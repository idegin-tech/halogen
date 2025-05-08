'use client'
import React from 'react'
import { Next13ProgressBar } from 'next13-progressbar';

type Props = {
    children?: React.ReactNode;
}

export default function Providers({ children }: Props) {
    return (
        <>
            <Next13ProgressBar height="4px" color="var(--primary)" options={{ showSpinner: true }} showOnShallow />
            {children}
        </>
    )
}