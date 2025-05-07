import { PageData, ProjectData } from "@/types/builder.types";

export const project: ProjectData = {
    id: "1",
    name: "My Project",
    description: "This is a sample project",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}

export const pages:PageData[] = [
    {
        id: "1",
        name: "Home",
        slug: "home",
        route: "/",
        project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "2",
        name: "About",
        slug: "about",
        route: "/about",
        project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "3",
        name: "Contact",
        slug: "contact",
        route: "/contact",
        project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
]
