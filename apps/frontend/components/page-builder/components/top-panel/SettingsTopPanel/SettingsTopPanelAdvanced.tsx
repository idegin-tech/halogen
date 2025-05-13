import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { ArrowRightCircle, Trash2, AlertCircle, Mail } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function SettingsTopPanelAdvanced() {
  const [transferOwnershipDialogOpen, setTransferOwnershipDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const projectName = "My Amazing Project"; // This would come from your project state

  const handleTransferOwnership = () => {
    // This would typically make an API call to transfer ownership
    console.log('Transferring ownership to email:', newOwnerEmail);
    setTransferOwnershipDialogOpen(false);
    setNewOwnerEmail('');
  };

  const handleDeleteProject = () => {
    // This would typically make an API call to delete the project
    console.log('Deleting project');
    setDeleteDialogOpen(false);
    setDeleteConfirmText('');
  };

  return (
    <div className="p-4 space-y-8">
      {/* Transfer Ownership Section */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Ownership</CardTitle>
          <CardDescription>
            Transfer ownership of this project to another user. You will become a manager after the transfer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ArrowRightCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Transfer this project to another user</p>
                <p className="text-sm text-muted-foreground">The new owner will have full control over this project</p>
              </div>
            </div>
            <Button onClick={() => setTransferOwnershipDialogOpen(true)} variant="outline">
              Transfer Ownership
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Delete Project</CardTitle>
            <CardDescription>
              This action is irreversible. Once deleted, all project data will be permanently removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">Delete this project permanently</p>
                  <p className="text-sm text-muted-foreground">All pages, components, and settings will be lost</p>
                </div>
              </div>
              <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive">
                Delete Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Ownership Dialog */}      <AlertDialog open={transferOwnershipDialogOpen} onOpenChange={setTransferOwnershipDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Project Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the email address of the user to transfer ownership of "{projectName}" to. You will become a manager of this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">            <Label htmlFor="new-owner-email" className="mb-2 block">New Owner Email</Label>
            <div className="relative">
              <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-owner-email"
                type="email"
                placeholder="user@example.com"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                className="mb-4 pl-8"
              />
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 dark:bg-amber-950 dark:border-amber-900">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium">Important note about transferring ownership:</p>
                <p className="mt-1">Once you transfer ownership, you will no longer have owner privileges for this project. The new owner will have full control, including the ability to remove you from the project.</p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleTransferOwnership}
              disabled={!newOwnerEmail || !newOwnerEmail.includes('@')}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
            >
              Transfer Ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project "{projectName}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 dark:bg-red-950 dark:border-red-900">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-medium">Warning: This action is irreversible</p>
                <p className="mt-1">All project data, pages, components, and configurations will be permanently lost.</p>
              </div>
            </div>
            
            <div className="space-y-2">              <Label htmlFor="confirm">
                Type <span className="font-semibold">delete this project</span> to confirm
              </Label>
              <Input
                id="confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="border-red-300 focus-visible:ring-red-400 dark:border-red-700"
                placeholder="delete this project"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              disabled={deleteConfirmText !== "delete this project"}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
