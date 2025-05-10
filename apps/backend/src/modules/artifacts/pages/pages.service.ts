import mongoose from 'mongoose';
import PageModel from './pages.model';
import Logger from '../../../config/logger.config';

export class PagesService {
    static async syncPages(
        projectId: string, 
        pages: any[] = []
    ): Promise<{ syncedPages: Record<string, any>; deletedPages: string[] }> {
        try {
            const syncedPages: Record<string, any> = {};
            const deletedPages: string[] = [];
            
            const allExistingPages = await PageModel.find({ project: projectId });
            
            const incomingPageIds = new Set(
                pages.map(page => page.page_id)
            );
            
            const pagesToDelete = allExistingPages.filter(
                page => !incomingPageIds.has(page.page_id)
            );
            
            for (const pageToDelete of pagesToDelete) {
                await PageModel.findByIdAndDelete(pageToDelete._id);
                deletedPages.push(pageToDelete.page_id);
            }
            
            if (pages.length > 0) {
                const pagesByPageId = new Map();
                allExistingPages.forEach(page => {
                    pagesByPageId.set(page.page_id, page);
                });
                
                for (const pageData of pages) {
                    const existingPage = pagesByPageId.get(pageData.page_id);
                    
                    if (existingPage) {
                        const updatedPage = await PageModel.findByIdAndUpdate(
                            existingPage._id,
                            {
                                ...pageData,
                                updatedAt: new Date()
                            },
                            { new: true }
                        );
                        syncedPages[pageData.page_id] = updatedPage;
                    } else {
                        // Create new page
                        const page = new PageModel({
                            ...pageData,
                            project: projectId
                        });
                        const savedPage = await page.save();
                        syncedPages[pageData.page_id] = savedPage;
                    }
                }
            }
            
            return { 
                syncedPages, 
                deletedPages
            };
        } catch (error) {
            Logger.error(`Pages sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    
    static async createPlaceholderPage(projectId: string, pageId: string): Promise<mongoose.Document> {
        try {
            const placeholderPage = new PageModel({
                name: `Page ${pageId}`,
                path: '/placeholder',
                isStatic: true,
                project: projectId,
                page_id: pageId
            });
            
            return await placeholderPage.save();
        } catch (error) {
            Logger.error(`Create placeholder page error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    
    static async getPageMapByPageIds(projectId: string): Promise<Map<string, mongoose.Types.ObjectId>> {
        const pageIdToObjectMap = new Map<string, mongoose.Types.ObjectId>();
        const pagesForProject = await PageModel.find({ project: projectId });
        
        for (const page of pagesForProject) {
            if (page._id && page.page_id) {
                //@ts-ignore
                pageIdToObjectMap.set(page.page_id, page._id);
            }
        }
        
        return pageIdToObjectMap;
    }
}
