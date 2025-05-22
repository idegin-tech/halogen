import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PaintBucket, SettingsIcon, Loader2, Upload, AlertCircle } from 'lucide-react'
import { useBuilderContext } from '@/context/builder.context'
import { useQuery, useMutation } from '@/hooks/useApi'
import { ProjectMetadata } from '@halogen/common/types'
import { toast } from 'sonner'
import axios from 'axios';
import { useProjectContext } from '@/context/project.context'

// File upload interfaces
interface FileUploadResponse {
    url: string;
    filename: string;
}

interface ApiResponse<T> {
    status: string;
    message: string;
    payload: T;
}

export default function SettingsTopPanelMetadata() {
    const { state: { project } } = useProjectContext();
    const [formData, setFormData] = useState<Partial<ProjectMetadata>>({
        title: '',
        description: '',
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        favicon: '',
    });
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [fileUploading, setFileUploading] = useState<{ favicon: boolean, ogImage: boolean }>({
        favicon: false,
        ogImage: false
    });
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Fetch metadata for the current project
    const { data: metadata, isLoading, error, refetch } = useQuery<ProjectMetadata>(
        project?._id ? `/project-metadata/project/${project?._id}` : '',
        {},
        [project?._id],
        { enabled: !!project?._id }
    );    // Update metadata mutation - using PUT method for proper update
    const { mutate: updateMetadata, isLoading: isUpdating } = useMutation<ProjectMetadata, Partial<ProjectMetadata>>(
        'project-metadata', // Base endpoint 
        { method: 'PUT' } // Specify PUT method to match backend route expectation
    );

    // Handle changes in the form fields
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
        setIsFormDirty(true);
    };
    
    // Delete a file from the server
    const deleteFile = async (type: 'favicon' | 'ogImage'): Promise<boolean> => {
        try {
            if (!project?._id) {
                throw new Error('Project ID is required');
            }
            
            setFileUploading(prev => ({ ...prev, [type]: true }));
            setUploadError(null);
            
            // Use the specific endpoint based on the file type
            const endpoint = type === 'favicon'
                ? `/uploads/project/${project._id}/favicon`
                : `/uploads/project/${project._id}/og-image`;
                
            // Delete the file using API client
            const response = await axios.delete<ApiResponse<{ projectId: string }>>(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${endpoint}`,
                {
                    withCredentials: true
                }
            );
              // Update the form data
            setFormData(prev => ({
                ...prev,
                [type === 'favicon' ? 'favicon' : 'ogImage']: ''
            }));
            setIsFormDirty(true);
            
            toast.success(`${type === 'favicon' ? 'Favicon' : 'Open Graph image'} deleted successfully`);
            
            // Refresh metadata from server to ensure we have the latest data
            refetch();
            return true;
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            setUploadError(`Failed to delete ${type === 'favicon' ? 'favicon' : 'image'}`);
            return false;
        } finally {
            setFileUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    // Upload a file to the server
    const uploadFile = async (file: File, type: 'favicon' | 'ogImage'): Promise<string | null> => {
        try {
            setFileUploading(prev => ({ ...prev, [type]: true }));
            setUploadError(null);
            
            if (!project?._id) {
                throw new Error('Project ID is required');
            }

            // Create form data for file upload
            const formData = new FormData();
            formData.append('file', file);
            
            // Use the specific endpoint based on the file type
            const endpoint = type === 'favicon'
                ? `/uploads/project/${project._id}/favicon`
                : `/uploads/project/${project._id}/og-image`;

            // Normally we'd use our API client, but for file uploads we need multipart/form-data
            const response = await axios.post<ApiResponse<FileUploadResponse>>(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${endpoint}`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.payload.url) {
                return response.data.payload.url;
            }
            return null;
        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
            setUploadError(`Failed to upload ${type === 'favicon' ? 'favicon' : 'image'}`);
            return null;
        } finally {
            setFileUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    // Handle file input change
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'favicon' | 'ogImage') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        // For preview before upload is complete
        const localUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            [type]: localUrl
        }));
        setIsFormDirty(true);        // Upload the file
        const uploadedUrl = await uploadFile(file, type);
        if (uploadedUrl) {
            setFormData(prev => ({
                ...prev,
                [type]: uploadedUrl
            }));
            toast.success(`${type === 'favicon' ? 'Favicon' : 'Open Graph image'} uploaded successfully`);
            
            // Refresh metadata from server to ensure we have the latest data
            refetch();
        }
    };

    useEffect(() => {
        if (metadata) {
            setFormData({
                title: metadata.title || '',
                description: metadata.description || '',
                keywords: metadata.keywords || '',
                ogTitle: metadata.ogTitle || '',
                ogDescription: metadata.ogDescription || '',
                ogImage: metadata.ogImage || '',
                favicon: metadata.favicon || '',
            });
            setIsFormDirty(false);
        }
    }, [metadata]);    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!project?._id) {
            toast.error("Project data is not available");
            return;
        }

        // Don't submit while files are uploading
        if (fileUploading.favicon || fileUploading.ogImage) {
            toast.warning("Please wait for file uploads to complete");
            return;
        }

        try {
            // Use the mutate function with the proper endpoint for updating by project ID
            await updateMetadata(`project/${project._id}`, {
                ...formData,
                project: project._id
            });

            toast.success("Metadata updated successfully");
            setIsFormDirty(false);
            refetch();
        } catch (error) {
            console.error("Error updating metadata:", error);
            toast.error("Failed to update metadata");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <p className="text-destructive font-medium">Failed to load metadata</p>
                <Button onClick={() => refetch()} variant="outline" className="mt-2">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>SEO Metadata</CardTitle>
                    <CardDescription>Configure the metadata for search engines and social sharing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Site Title</Label>
                        <Input
                            id="title"
                            placeholder="Enter site title"
                            value={formData.title}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Site Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter site description for search engines"
                            className="min-h-[100px]"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords</Label>
                        <Input
                            id="keywords"
                            placeholder="keyword1, keyword2, keyword3"
                            value={formData.keywords}
                            onChange={handleInputChange}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate keywords with commas</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Favicon</CardTitle>
                    <CardDescription>Upload a favicon for your site (32x32)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 w-full flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer">
                            <label htmlFor="favicon-upload" className="w-full flex flex-col items-center cursor-pointer">
                                {formData.favicon ? (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="h-24 w-24 border rounded-md flex items-center justify-center bg-muted p-2- shadow-sm overflow-hidden">
                                            <img
                                                src={formData.favicon}
                                                alt="Favicon"
                                                className="w-[70%] object-contain"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium">Current favicon</p>
                                            <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="h-20 w-20 rounded-md flex items-center justify-center bg-muted/50">
                                            <SettingsIcon className="h-10 w-10 text-muted-foreground/50" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium">Upload favicon (32x32)</p>
                                            <p className="text-xs text-muted-foreground mt-1">Click to upload a PNG or ICO file</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="favicon-upload"
                                    className="hidden"
                                    accept=".ico,.png"
                                    onChange={(e) => handleFileChange(e, 'favicon')}
                                />
                            </label>
                        </div>                        {formData.favicon && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => deleteFile('favicon')}
                            >
                                Remove favicon
                            </Button>
                        )}
                        {fileUploading.favicon && (
                            <div className="flex items-center space-x-2 mt-2">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <p className="text-sm text-primary">Uploading favicon...</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Social Media Cards</CardTitle>
                    <CardDescription>Configure how your site appears when shared on social media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ogTitle">Open Graph Title</Label>
                        <Input
                            id="ogTitle"
                            placeholder="Title for social sharing"
                            value={formData.ogTitle}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ogDescription">Open Graph Description</Label>
                        <Textarea
                            id="ogDescription"
                            placeholder="Description for social sharing"
                            className="min-h-[80px]"
                            value={formData.ogDescription}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ogImage">Open Graph Image</Label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 w-full flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer relative">
                            <label htmlFor="og-image-upload" className="w-full cursor-pointer">
                                {formData.ogImage ? (
                                    <div className="relative w-full">
                                        <img
                                            src={formData.ogImage}
                                            alt="OG Preview"
                                            className="w-full h-48 object-cover rounded-md shadow-sm"
                                        />
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                            <Button variant="secondary" size="sm" className="gap-1" type="button">
                                                <PaintBucket className="h-4 w-4" /> Replace image
                                            </Button>
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            Recommended: 1200×630
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-48 flex flex-col items-center justify-center">
                                        <PaintBucket className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                        <p className="text-sm font-medium">Upload Open Graph image</p>
                                        <p className="text-xs text-muted-foreground mt-1">Recommended size: 1200×630 pixels</p>
                                        <Button variant="outline" size="sm" className="mt-4" type="button">Select image</Button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="og-image-upload"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e, 'ogImage')}
                                />
                            </label>
                        </div>                        {formData.ogImage && (
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground"
                                    onClick={() => deleteFile('ogImage')}
                                >
                                    Remove image
                                </Button>
                            </div>
                        )}
                        {fileUploading.ogImage && (
                            <div className="flex items-center space-x-2 mt-2">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <p className="text-sm text-primary">Uploading image...</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={!isFormDirty || isUpdating}
                    className="min-w-[120px]"
                >
                    {isUpdating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : 'Save Changes'}
                </Button>
            </div>

            {uploadError && (
                <div className="mt-4">
                    <AlertCircle className="h-5 w-5 text-destructive inline-block mr-2" />
                    <span className="text-sm text-destructive">{uploadError}</span>
                </div>
            )}
        </form>
    );
}
