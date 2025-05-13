import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PaintBucket, SettingsIcon, Loader2, Upload } from 'lucide-react'
import { useBuilderContext } from '@/context/builder.context'
import { useQuery, useMutation } from '@/hooks/useApi'
import { ProjectMetadata } from '@halogen/common/types'
import { toast } from 'sonner'

export default function SettingsTopPanelMetadata() {
  const { state: { project } } = useBuilderContext();  const [formData, setFormData] = useState<Partial<ProjectMetadata>>({
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    favicon: '',
  });
  const [isFormDirty, setIsFormDirty] = useState(false);  // Fetch metadata for the current project
  const { data: metadata, isLoading, error, refetch } = useQuery<ProjectMetadata>(
    project?._id ? `/project-metadata/project/${project?._id}` : '',
    {},
    [project?._id],
    { enabled: !!project?._id }
  );
  
  // Update metadata mutation
  const { mutate: updateMetadata, isLoading: isUpdating } = useMutation<ProjectMetadata, Partial<ProjectMetadata>>(
    project?._id ? `/project-metadata/project/${project?._id}` : ''
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
  }, [metadata]);// Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project?._id) {
      toast.error("Project data is not available");
      return;
    }    try {
      // Use the mutate function to update the metadata
      await updateMetadata({
        ...formData,
        project: project._id
      });
      
      toast.success("Metadata updated successfully");
      setIsFormDirty(false);
      refetch();
    } catch (error) {      console.error("Error updating metadata:", error);
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
          <div className="flex flex-col items-center">            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 w-full flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer">
              <label htmlFor="favicon-upload" className="w-full flex flex-col items-center cursor-pointer">
                {formData.favicon ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-24 w-24 border rounded-md flex items-center justify-center bg-muted p-2 shadow-sm">
                      <img 
                        src={formData.favicon} 
                        alt="Favicon" 
                        className="max-h-full max-w-full object-contain" 
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Here you would normally upload to server first
                      // For now just set the local URL for preview
                      const fileUrl = URL.createObjectURL(file);
                      setFormData(prev => ({
                        ...prev,
                        favicon: fileUrl
                      }));
                      setIsFormDirty(true);
                    }
                  }}
                />
              </label>
            </div>
            {formData.favicon && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="mt-2"
              >
                Remove favicon
              </Button>
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
          </div>          <div className="space-y-2">
            <Label htmlFor="ogImage">Open Graph Image</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 w-full flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer relative">
              {formData.ogImage ? (
                <div className="relative w-full">
                  <img 
                    src={formData.ogImage} 
                    alt="OG Preview" 
                    className="w-full h-48 object-cover rounded-md shadow-sm" 
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button variant="secondary" size="sm" className="gap-1">
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
                  <Button variant="outline" size="sm" className="mt-4">Select image</Button>
                </div>
              )}
              <input 
                type="file" 
                id="og-image-upload" 
                className="hidden" 
                accept=".jpg,.jpeg,.png" 
              />
            </div>
            {formData.ogImage && (
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground"
                >
                  Remove image
                </Button>
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
    </form>
  )
}