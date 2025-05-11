import React from 'react'
import { Next13ProgressBar } from 'next13-progressbar';

export default function Provider({ children }: { children: any }) {
    return (
        <>
            <Next13ProgressBar height="4px" color="#0A2FFF" options={{ showSpinner: true }} showOnShallow />
            {children}
        </>
    )
}
