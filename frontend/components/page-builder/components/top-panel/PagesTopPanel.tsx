import React, { useState, useEffect, useMemo } from 'react'
import TopPanelContainer from './TopPanelContainer'
import { FileIcon } from 'lucide-react'
import { useBuilderContext } from '@/context/builder.context'
import { usePage } from '@/hooks/usePage'
import { Input, Button } from '@heroui/react'
import { PageData } from '@/types/builder.types'

export default function PagesTopPanel({show, onHide}:{show: boolean, onHide: () => void}) {
    const { state: { pages } } = useBuilderContext();
    const { 
        selectedPageId, 
        setActivePage, 
        addPage, 
        updatePage, 
        removePage, 
        getActivePage 
    } = usePage();

    const [pageName, setPageName] = useState('');
    const [currentPage, setCurrentPage] = useState<PageData | null>(null);
    
    const generatedRoute = useMemo(() => {
        if (!pageName) return '';
        if (currentPage?.isStatic) return currentPage.path || '';
        return '/' + pageName.toLowerCase().trim().replace(/\s+/g, '-');
    }, [pageName, currentPage]);
    
    const validation = useMemo(() => {
        const duplicateName = pages.find(p => 
            p.name.toLowerCase() === pageName.toLowerCase() && 
            p.id !== selectedPageId
        );
        
        const duplicateRoute = pages.find(p => 
            p.path === generatedRoute && 
            p.id !== selectedPageId
        );
        
        return {
            nameExists: !!duplicateName,
            routeExists: !!duplicateRoute
        };
    }, [pageName, generatedRoute, pages, selectedPageId]);

    useEffect(() => {
        const activePage = getActivePage();
        if (activePage) {
            setPageName(activePage.name);
            setCurrentPage(activePage);
        }
    }, [selectedPageId, getActivePage]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPageId && !validation.nameExists && !validation.routeExists) {
            if (currentPage?.isStatic) {
                updatePage(selectedPageId, {
                    name: pageName
                });
            } else {
                updatePage(selectedPageId, {
                    name: pageName,
                    path: generatedRoute
                });
            }
        }
    };

    const handleAddPage = (name?: string) => {
        const pageTitle = name || 'New Page';
        const newPage = addPage({ 
            name: pageTitle, 
            path: '/' + pageTitle.toLowerCase().replace(/\s+/g, '-')
        });
        return newPage.id; // Return the new page ID
    };

    const handleRemovePage = (id: string) => {
        removePage(id);
    };
    
    const handleSetChange = (data: any) => {
        console.log('Set change', data);
    };
    
    return (
        <>
            <TopPanelContainer
                heading="Pages"
                onClose={onHide}
                show={show}
                setList={pages.map((page) => ({
                    id: page.id,
                    name: page.name,
                    icon: <FileIcon />,
                    isLocked: page.isStatic,
                }))}
                activeSetId={selectedPageId}
                onAddSet={handleAddPage}
                onRemoveSet={handleRemovePage}
                onSetActiveSet={setActivePage}
                onSetChange={handleSetChange}
            >
                <div className='flex-1 overflow-x-hidden overflow-y-auto'>
                    {selectedPageId && currentPage ? (
                        <form onSubmit={handleSubmit} className="space-y-4 p-2">
                            <div className="space-y-2">
                                <Input
                                    label="Page Name"
                                    placeholder="Enter page name"
                                    value={pageName}
                                    onChange={(e) => setPageName(e.target.value)}
                                    fullWidth
                                    variant="bordered"
                                    color={validation.nameExists ? "danger" : "default"}
                                    errorMessage={validation.nameExists ? "This page name already exists" : ""}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Input
                                    label="Page Route (auto-generated)"
                                    value={generatedRoute}
                                    fullWidth
                                    variant="bordered"
                                    isReadOnly
                                    isDisabled={currentPage.isStatic}
                                    color={validation.routeExists ? "danger" : "default"}
                                    errorMessage={validation.routeExists ? "This route already exists" : ""}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {currentPage.isStatic 
                                        ? "Route cannot be changed for static pages." 
                                        : "The URL path is automatically generated from the page name."}
                                </p>
                            </div>

                            <div className="pt-4">
                                <Button 
                                    color="primary"
                                    type="submit"
                                    fullWidth
                                    isDisabled={validation.nameExists || validation.routeExists}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                            <FileIcon className="h-12 w-12 mb-4 opacity-50" />
                            <p className="mb-2">No page selected</p>
                            <p className="text-sm">Select a page from the list or create a new one.</p>
                            <Button
                                color="primary"
                                variant="flat"
                                className="mt-4"
                                onClick={() => {
                                    const newId = handleAddPage();
                                    setActivePage(newId);
                                }}
                            >
                                Create New Page
                            </Button>
                        </div>
                    )}
                </div>
            </TopPanelContainer>
        </>
    )
}
