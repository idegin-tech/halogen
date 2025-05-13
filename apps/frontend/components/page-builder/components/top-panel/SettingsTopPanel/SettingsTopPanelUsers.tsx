import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { PlusCircle, Search, Mail, MoreVertical, Shield, UserPlus, UserX, AlertCircle, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ProjectUserRole, ProjectUserStatus } from '@halogen/common/types'
import { PaginatedResponse } from '@halogen/common/types'
import { useQuery, useMutation } from '@/hooks/useApi'
import { useBuilderContext } from '@/context/builder.context'
import { toast } from 'sonner'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

// Typing for the project users response
interface ProjectUserItem {
  _id: string;
  user: {
    _id: string;
    displayName: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  role: ProjectUserRole;
  status: ProjectUserStatus;
  createdAt: string;
  updatedAt: string;
}

interface ProjectUsersResponse extends PaginatedResponse<ProjectUserItem> {}

export default function SettingsTopPanelUsers() {
  const { state: { project } } = useBuilderContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ProjectUserRole.MANAGER);
  const [confirmDialog, setConfirmDialog] = useState<{ 
    open: boolean, 
    userId: string | null, 
    action: 'remove' | 'changeRole' | null,
    newRole?: ProjectUserRole
  }>({
    open: false,
    userId: null,
    action: null
  });
  // Create project user mutation hooks
  const createUserMutation = useMutation('/project-users');
  const updateUserMutation = useMutation('/project-users');
  const removeUserMutation = useMutation('/project-users');
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when search changes
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]); 
  const { data, isLoading, error, refetch } = useQuery<ProjectUsersResponse>(
    project?._id ? `/project-users/project/${project?._id}` :'',
    { 
      params: { 
        page, 
        limit,
        search: debouncedSearchTerm || undefined
      } 
    },    [page, limit, debouncedSearchTerm, project?._id],
    { enabled: !!project?._id, }
  );
  
  // Function to get initials from name
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Invite user handler
  const handleInvite = async () => {
    if (!project?._id) {
      toast.error("Project data is not available");
      return;
    }
    
    try {
      const result = await createUserMutation.mutate({
        project: project._id,
        email: inviteEmail,
        role: inviteRole
      });
      
      if (result) {
        toast.success("Invitation sent successfully");
        setInviteDialogOpen(false);
        setInviteEmail('');
        refetch();
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error("Failed to invite user");
    }
  };
  
  // Remove user handler
  const handleRemoveUser = async () => {
    if (!confirmDialog.userId) return;
    
    try {
      const result = await removeUserMutation.remove(confirmDialog.userId);
      if (result !== null) {
        toast.success("User removed successfully");
        refetch();
      }
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user");
    } finally {
      setConfirmDialog({ open: false, userId: null, action: null });
    }
  };
  
  // Change role handler
  const handleChangeRole = async () => {
    if (!confirmDialog.userId || !confirmDialog.newRole) return;
    
    try {
      const result = await updateUserMutation.update(confirmDialog.userId, {
        role: confirmDialog.newRole
      });
      
      if (result) {
        toast.success("User role updated successfully");
        refetch();
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setConfirmDialog({ open: false, userId: null, action: null });
    }
  };

  // Open role change confirmation dialog
  const openChangeRoleDialog = (userId: string, newRole: ProjectUserRole) => {
    setConfirmDialog({ 
      open: true, 
      userId, 
      action: 'changeRole',
      newRole
    });
  };

  // Open remove user confirmation dialog
  const openRemoveDialog = (userId: string) => {
    setConfirmDialog({ 
      open: true, 
      userId, 
      action: 'remove' 
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const roleColorMap = {
    [ProjectUserRole.OWNER]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    [ProjectUserRole.MANAGER]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    [ProjectUserRole.DEVELOPER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  };

  const statusColorMap = {
    [ProjectUserStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [ProjectUserStatus.PENDING]: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    [ProjectUserStatus.SUSPENDED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Project Users</CardTitle>
            <CardDescription>Manage users who have access to this project</CardDescription>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="flex items-center gap-1">
            <UserPlus className="h-4 w-4 mr-1" />
            Invite User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
              <h3 className="font-medium">Error loading users</h3>
              <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : data?.docs && data.docs.length > 0 ? (
            <>
              <div className="space-y-3">
                {data.docs.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-3">                        <Avatar className="h-10 w-10">
                        {user.user.avatarUrl ? (
                          <AvatarImage src={user.user.avatarUrl} alt={user.user.displayName || user.user.name} />
                        ) : (
                          <AvatarFallback>{getInitials(user.user.displayName || user.user.name)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.user.displayName || user.user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={roleColorMap[user.role]}>
                        {user.role}
                      </Badge>
                      <Badge variant="outline" className={statusColorMap[user.status]}>
                        {user.status}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button disabled={user.role === ProjectUserRole.OWNER} variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role !== ProjectUserRole.OWNER && (
                            <>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openChangeRoleDialog(user._id, ProjectUserRole.MANAGER)}>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Change to Manager</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => openRemoveDialog(user._id)}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Remove User</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {data.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!data.hasPrevPage}
                          onClick={() => handlePageChange(1)}
                        >
                          <PlusCircle className="h-4 w-4 rotate-45" />
                          <span className="sr-only">First page</span>
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8"
                          disabled={!data.hasPrevPage}
                          onClick={() => handlePageChange(data.page - 1)}
                        >
                          <PaginationPrevious className="h-4 w-4" />
                          <span className="sr-only">Previous page</span>
                        </Button>
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                        .filter(pageNum => {
                          // Show current page and pages close to it
                          return (
                            pageNum === 1 || 
                            pageNum === data.totalPages || 
                            Math.abs(pageNum - data.page) <= 1
                          );
                        })
                        .map((pageNum, idx, array) => {
                          // If there's a gap, show ellipsis
                          if (idx > 0 && pageNum > array[idx - 1] + 1) {
                            return (
                              <React.Fragment key={`ellipsis-${pageNum}`}>
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem key={pageNum}>
                                  <PaginationLink 
                                    isActive={pageNum === data.page}
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              </React.Fragment>
                            );
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink 
                                isActive={pageNum === data.page}
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                      
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!data.hasNextPage}
                          onClick={() => handlePageChange(data.page + 1)}
                        >
                          <PaginationNext className="h-4 w-4" />
                          <span className="sr-only">Next page</span>
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!data.hasNextPage}
                          onClick={() => handlePageChange(data.totalPages)}
                        >
                          <PlusCircle className="h-4 w-4 rotate-[135deg]" />
                          <span className="sr-only">Last page</span>
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 flex flex-col items-center text-center">
              <p className="text-muted-foreground">No users found</p>
              {searchTerm && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4 bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {data ? `${data.totalDocs} users in this project` : 'Loading users...'}
          </div>
        </CardFooter>
      </Card>

      {/* Invite user dialog */}
      <AlertDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invite User</AlertDialogTitle>
            <AlertDialogDescription>
              Send an invitation to a user to join this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  className="pl-8"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectUserRole.MANAGER}>Manager</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Managers can edit but not delete the project or transfer ownership.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInvite}
              disabled={!inviteEmail || !inviteEmail.includes('@') || createUserMutation.isLoading}
            >
              {createUserMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : 'Send Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Remove User */}
      <AlertDialog
        open={confirmDialog.open && confirmDialog.action === 'remove'}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, userId: null, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from the project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-red-500 hover:bg-red-600"
            >
              {removeUserMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : 'Remove User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Change Role */}
      <AlertDialog
        open={confirmDialog.open && confirmDialog.action === 'changeRole'}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, userId: null, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user's role? This will modify their permissions for this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole}>
              {updateUserMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Change Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
