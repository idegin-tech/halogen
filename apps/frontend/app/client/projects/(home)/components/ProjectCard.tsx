'use client';

import React from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent} from '@/components/ui/card';
import {ProjectData} from '@halogen/common/types';
import Image from 'next/image';
import {CalendarClock, ExternalLink} from 'lucide-react';
import {formatDistanceToNow} from 'date-fns';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';

interface ProjectCardProps {
    project: ProjectData;
}

export function ProjectCard({project}: ProjectCardProps) {
    const router = useRouter();

    // Format the updated date to relative time (e.g., "2 days ago")
    const formattedDate = formatDistanceToNow(new Date(project.updatedAt), {addSuffix: true});

    return (
        <Card
            className="group overflow-hidden hover:shadow-lg transition-all py-0 duration-300 h-full bg-card flex flex-col border border-border/50 hover:border-primary/20">
            <div className="aspect-video relative overflow-hidden bg-muted">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"/>

                {/* Status badge for "online" - customize this based on project status if needed */}
                <Badge
                    // variant="success"
                    className="absolute top-3 right-3 z-20 bg-emerald-500/90 text-white shadow-md"
                >
                    Online
                </Badge>

                <Image
                    src={project.thumbnail || '/placeholder.png'}
                    alt={project.name}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false}
                />
            </div>

            <CardContent className="p-5 flex-grow flex flex-col justify-between gap-2">
                <div className="space-y-2.5">
                    <h3 className="text-xl font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {project.name}
                    </h3>

                    <p className={cn(
                        "text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]",
                        !project.description && "italic opacity-70"
                    )}>
                        {project.description || "No description provided"}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5"/>
                        <span>{formattedDate}</span>
                    </div>

                    <div
                        className="flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                        <span>Open</span>
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5"/>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

