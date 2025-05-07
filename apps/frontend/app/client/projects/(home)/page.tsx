"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    
    setIsLoading(true);
    
    // Generate a unique ID
    const newProjectId = `proj_${Date.now()}`;
    
    const newProject = {
      id: newProjectId,
      name: projectName.trim(),
      description: projectDescription.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnail: `https://source.unsplash.com/random/300x200?website,${encodeURIComponent(projectName)}`
    };
    
    // Reset form and close modal
    setProjectName("");
    setProjectDescription("");
    setIsModalOpen(false);
    setIsLoading(false);
    
    // Navigate to builder page with the new project ID
    router.push(`/client/projects/${newProjectId}/builder`);
  };
  
  // Placeholder data for projects
  const projects:any[] = [];
  
  // Add demo projects if no projects exist
  const demoProjects = [
    { 
      id: "demo1", 
      name: "Corporate Website", 
      description: "Modern corporate website with hero, features, and testimonials",
      createdAt: "2025-05-01T10:00:00Z",
      updatedAt: "2025-05-03T14:30:00Z",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
    },
    { 
      id: "demo2", 
      name: "E-commerce Store", 
      description: "Online store with product listings and shopping cart",
      createdAt: "2025-04-15T08:20:00Z",
      updatedAt: "2025-04-30T16:45:00Z",
      thumbnail: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
    }
  ];
  
  const allProjects = [...projects, ...(projects.length === 0 ? demoProjects : [])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
          <p className="text-muted-foreground">Manage your website projects</p>
        </div>
        
        <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <AlertDialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Create Project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Project</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="project-name" className="text-sm font-medium leading-none">Project Name</label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="project-desc" className="text-sm font-medium leading-none">Description</label>
                <Textarea
                  id="project-desc"
                  placeholder="Enter project description (optional)"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProject}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img
                src={`${project.thumbnail}`}
                alt={project.name}
                className="object-cover w-full h-full"
              />
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{project.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => router.push(`/client/projects/${project.id}/builder`)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Create project card */}
        <Card 
          className="overflow-hidden border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center"
          onClick={() => setIsModalOpen(true)}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <PlusIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Create New Project</h3>
            <p className="text-sm text-muted-foreground">Start building your new website</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
