import React, { useState, useEffect, useMemo } from 'react'
import TopPanelContainer from './TopPanelContainer'
import { FileIcon } from 'lucide-react'
import { useBuilderContext } from '@/context/builder.context'
import { usePage } from '@/hooks/usePage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageData } from '@halogen/common/types'
import { generateId } from '@halogen/common'


export default function PagesTopPanel({show, onHide}:{show: boolean, onHide: () => void}) {
    const { state } = useBuilderContext();
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

    useEffect(() => {
        if (selectedPageId) {
            const page = state.pages.find(p => p.page_id === selectedPageId);
            if (page) {
                setPageName(page.name);
                setCurrentPage(page);
            }
        } else {
            setPageName('');
            setCurrentPage(null);
        }
    }, [selectedPageId, state.pages]);

    const generatedRoute = useMemo(() => {
        if (!pageName) return '';
        if (currentPage?.isStatic) return currentPage.path || '';
        return '/' + pageName.toLowerCase().trim().replace(/\s+/g, '-');
    }, [pageName, currentPage]);
    
    const validation = useMemo(() => {
        const duplicateName = state.pages.find(p => 
            p.name.toLowerCase() === pageName.toLowerCase() && 
            p.page_id !== selectedPageId
        );
        
        const duplicateRoute = state.pages.find(p => 
            p.path === generatedRoute && 
            p.page_id !== selectedPageId
        );
        
        return {
            nameExists: !!duplicateName,
            routeExists: !!duplicateRoute
        };
    }, [pageName, generatedRoute, state.pages, selectedPageId]);

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
        const pageId = generateId(9);
        const newPage = addPage({ 
            page_id: pageId,
            name: pageTitle, 
            path: '/' + pageTitle.toLowerCase().replace(/\s+/g, '-'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        console.log('New page added:', newPage);
        return newPage.page_id;
    };

    const handleRemovePage = (id: string) => {
        removePage(id);
    };
    
    const handleSetChange = (data: any) => {
        console.log('Set change', data);
    };

    const breadcrumbs = useMemo(() => {
        const items: {label: string, href?: string}[] = [
            { label: "Pages", href: "#" }
        ];
        
        if (selectedPageId) {
            const page = state.pages.find(p => p.page_id === selectedPageId);
            if (page) {
                items.push({ label: page.name });
            }
        }
        
        return items;
    }, [selectedPageId, state.pages]);

    return (
        <>
            <TopPanelContainer
                heading="Pages"
                onClose={onHide}
                show={show}
                setList={state.pages.map((page) => ({
                    id: page.page_id,
                    name: page.name,
                    icon: <FileIcon />,
                    isLocked: page.isStatic,
                }))}
                activeSetId={selectedPageId}
                onAddSet={handleAddPage}
                onRemoveSet={handleRemovePage}
                onSetActiveSet={setActivePage}
                onSetChange={handleSetChange}
                breadcrumbs={breadcrumbs}
            >
                <div className='flex-1 overflow-x-hidden overflow-y-auto'>
                    {selectedPageId && currentPage ? (
                        <form onSubmit={handleSubmit} className="space-y-4 p-2">
                            <div className="space-y-2">
                                <div className="grid gap-1.5">
                                    <label htmlFor="page-name" className="text-sm font-medium">Page Name</label>
                                    <Input
                                        id="page-name"
                                        placeholder="Enter page name"
                                        value={pageName}
                                        onChange={(e) => setPageName(e.target.value)}
                                        className={`w-full ${validation.nameExists ? 'border-destructive ring-destructive' : ''}`}
                                    />
                                    {validation.nameExists && (
                                        <p className="text-xs text-destructive">This page name already exists</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="grid gap-1.5">
                                    <label htmlFor="page-route" className="text-sm font-medium">Page Route (auto-generated)</label>
                                    <Input
                                        id="page-route"
                                        value={generatedRoute}
                                        className={`w-full ${validation.routeExists ? 'border-destructive ring-destructive' : ''}`}
                                        readOnly
                                        disabled={currentPage.isStatic}
                                    />
                                    {validation.routeExists ? (
                                        <p className="text-xs text-destructive">This route already exists</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            {currentPage.isStatic 
                                                ? "Route cannot be changed for static pages." 
                                                : "The URL path is automatically generated from the page name."}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button 
                                    variant="default"
                                    type="submit"
                                    className="w-full"
                                    disabled={validation.nameExists || validation.routeExists}
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
                                variant="secondary"
                                className="mt-4"
                                onClick={() => {
                                    const newPageId = handleAddPage();
                                    setActivePage(newPageId);
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
