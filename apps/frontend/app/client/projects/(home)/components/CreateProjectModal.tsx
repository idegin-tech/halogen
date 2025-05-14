'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@/hooks/useApi';
import { toast } from 'sonner';
import { generateId } from '@halogen/common';

interface CreateProjectModalProps {
  onProjectCreated?: () => void;
}

export function CreateProjectModal({ onProjectCreated }: CreateProjectModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const router = useRouter();
  
  const createProject = useMutation<any, any>('/projects');

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    try {
      const project_id = generateId(12);
      const homePageId = generateId(12);
      
      const projectData = {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        project_id: `proj_${project_id}`,
        pages: [{
          page_id: homePageId,
          name: 'Home',
          path: '/',
          isStatic: true
        }]
      };
      
      const newProject = await createProject.mutate(projectData as any);
      
      if (newProject && newProject._id) {
        toast.success('Project created successfully!');
        
        // Reset form and close modal
        setProjectName('');
        setProjectDescription('');
        setIsModalOpen(false);
        
        // Call the callback if provided
        if (onProjectCreated) {
          onProjectCreated();
        }
        
        // Navigate to builder page with the new project ID
        router.push(`/client/projects/${newProject._id}/builder`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
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
            disabled={createProject.isLoading}
          >
            {createProject.isLoading ? "Creating..." : "Create Project"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}