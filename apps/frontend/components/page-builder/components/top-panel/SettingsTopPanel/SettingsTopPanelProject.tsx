import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useBuilderContext } from '@/context/builder.context'
import { useMutation } from '@/hooks/useApi'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function SettingsTopPanelProject() {
    const { state: { project }, updateBuilderState } = useBuilderContext();
    const [name, setName] = useState(project?.name || '');
    const [description, setDescription] = useState(project?.description || ``);
    const [initialValues, setInitialValues] = useState({ name: '', description: '' });
    const [hasChanges, setHasChanges] = useState(false);
    
    // Set up mutation hook for updating the project
    const projectMutation = useMutation('/projects');
    
    // Initialize initial values when project data is available
    useEffect(() => {
        if (project) {
            setName(project.name || '');
            setDescription(project.description || '');
            setInitialValues({
                name: project.name || '',
                description: project.description || ''
            });
        }
    }, [project]);
    
    // Calculate if there are changes to save
    useEffect(() => {
        const nameChanged = name !== initialValues.name;
        const descriptionChanged = description !== initialValues.description;
        setHasChanges(nameChanged || descriptionChanged);
    }, [name, description, initialValues]);
    
    // Save project changes
    const handleSaveProject = async () => {
        if (!project || !project._id) {
            toast.error("Project data is not available");
            return;
        }
        
        try {
            // Update project via API
            const updatedProject = await projectMutation.update(project._id, {
                name,
                description
            });
            
            if (updatedProject) {
                // Update local state
                updateBuilderState({ 
                    project: {
                        ...project,
                        name,
                        description
                    }
                });
                
                // Update initial values
                setInitialValues({
                    name,
                    description
                });
                
                toast.success("Project settings updated successfully");
            }
        } catch (error) {
            console.error("Error updating project:", error);
            toast.error("Failed to update project settings");
        }
    };

    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                    <CardDescription>Manage your project details and configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                            id="project-name"
                            placeholder="Enter project name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="project-description">Project Description</Label>
                        <Textarea
                            id="project-description"
                            placeholder="Enter project description"
                            className="min-h-[100px]"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={handleSaveProject}
                        disabled={!name?.trim() || !hasChanges || projectMutation.isLoading} 
                        className="mt-4"
                    >
                        {projectMutation.isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : 'Save Project Settings'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
