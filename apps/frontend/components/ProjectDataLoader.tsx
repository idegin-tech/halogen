'use client';

import React from 'react';
import { useEffect, useState } from 'react';

interface ProjectDataLoaderProps<T> {
    fetchData: () => Promise<T>;
    children: (data: T) => React.ReactNode;
}

export default function ProjectDataLoader<T>({ fetchData, children }: ProjectDataLoaderProps<T>) {
    const [data, setData] = useState<T | null>(null);

    useEffect(() => {
        fetchData().then(setData);
    }, [fetchData]);

    if (!data) {
        return null; // Or a loading state if you prefer
    }

    return <>{children(data)}</>;
}
