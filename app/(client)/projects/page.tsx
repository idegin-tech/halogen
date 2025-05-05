"use client";

import { useState } from "react";
import { Button, Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PlusIcon } from "lucide-react";
import { useBuilderContext } from "@/context/builder.context";

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { state, updateBuilderState } = useBuilderContext();
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
    
    // Update context with new project
    updateBuilderState({
      project: newProject
    });
    
    // Reset form and close modal
    setProjectName("");
    setProjectDescription("");
    setIsModalOpen(false);
    setIsLoading(false);
    
    // Navigate to builder page with the new project ID
    router.push(`/client/projects/${newProjectId}/builder`);
  };
  
  // Placeholder data for projects
  const projects = state.project ? [state.project] : [];
  
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
    },
    { 
      id: "demo3", 
      name: "Portfolio Site", 
      description: "Personal portfolio for showcasing creative work",
      createdAt: "2025-04-10T09:15:00Z",
      updatedAt: "2025-05-02T11:20:00Z",
      thumbnail: "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80" 
    }
  ];
  
  const allProjects = [...projects, ...(projects.length === 0 ? demoProjects : [])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Projects</h1>
          <p className="text-muted-foreground">Create and manage your website projects</p>
        </div>
        
        <Button 
          color="primary" 
          startContent={<PlusIcon className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Project
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img
                src={`${project.thumbnail}`}
                alt={project.name}
                // fill
                className="object-cover"
              />
            </div>
            <CardBody className="p-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{project.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <Button 
                    size="sm" 
                    color="primary" 
                    variant="flat"
                    onClick={() => router.push(`/client/projects/${project.id}/builder`)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
        
        {/* Create project card */}
        <Card 
          className="overflow-hidden border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center"
          isPressable
          onClick={() => setIsModalOpen(true)}
        >
          <CardBody className="p-8 flex flex-col items-center justify-center text-center h-full">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <PlusIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Create New Project</h3>
            <p className="text-sm text-muted-foreground">Start building your new website</p>
          </CardBody>
        </Card>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Create New Project</ModalHeader>
          <ModalBody>
            <Input
              autoFocus
              label="Project Name"
              placeholder="Enter project name"
              variant="bordered"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <Textarea
              label="Description"
              placeholder="Enter project description (optional)"
              variant="bordered"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="mt-4"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleCreateProject} isLoading={isLoading}>
              Create Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
