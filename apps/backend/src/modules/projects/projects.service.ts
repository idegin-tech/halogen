import { Project, ProjectUserRole, PaginatedResponse, ProjectQueryOptions } from '@halogen/common';
import { generateUsername } from 'unique-username-generator';
import { CreateProjectDTO, UpdateProjectDTO, SyncProjectDTO } from './projects.dtos';
import ProjectModel from './projects.model';
import ProjectUserModel from '../project-users/project-users.model';
import Logger from '../../config/logger.config';
import mongoose from 'mongoose';
import PageModel from '../artifacts/pages/pages.model';
import VariableModel from '../artifacts/variables/variables.model';
import BlockInstanceModel from '../artifacts/block-instance/block-instances.model';

export class ProjectsService {
    static async generateUniqueSubdomain(): Promise<string> {
        let isUnique = false;
        let subdomain: string = generateUsername('-', 2);

        while (!isUnique) {
            subdomain = generateUsername('-', 2); 

            const existingProject = await ProjectModel.findOne({ subdomain });
            if (!existingProject) {
                isUnique = true;
            }
        }

        return subdomain;
    }

    static async createProject(userId: string, projectData: CreateProjectDTO): Promise<Project> {
        try {
            const subdomain = await this.generateUniqueSubdomain();
            
            const { pages: pagesData, ...projectFields } = projectData;
            
            if (!projectFields.project_id) {
                projectFields.project_id = `proj_${Date.now()}`;
            }

            const newProject = new ProjectModel({
                ...projectFields,
                subdomain,
                user: userId
            });

            const savedProject = await newProject.save();

            const projectUser = new ProjectUserModel({
                project: savedProject._id as string,
                user: userId,
                role: ProjectUserRole.OWNER
            });

            await projectUser.save();
            
           //@ts-ignore
            const homePageId = `page_home_${savedProject._id.toString().substring(0, 6)}`;
            
            // Always create a default home page
            const homePage = new PageModel({
                name: 'Home',
                path: '/',
                isStatic: true,
                project: savedProject._id,
                page_id: homePageId
            });
            
            await homePage.save();
        
            // If additional pages were provided, also create those
            if (pagesData && pagesData.length > 0) {
                for (const pageData of pagesData) {
                    // Skip if it's another attempt to create a page at the root path
                    if (pageData.path === '/') continue;
                    
                    const page = new PageModel({
                        ...pageData,
                        project: savedProject._id
                    });
                    
                    await page.save();
                }
            }

            const projectObj = savedProject.toObject();
            return {
                ...projectObj,
                _id: projectObj._id as string
            };
        } catch (error) {
            Logger.error(`Create project error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getProjectById(projectId: string) {
        try {
            const project = await ProjectModel.findById(projectId);
            if (!project) return null;
            
            const projectObj = project.toObject();
            
            const projectUsers = await ProjectUserModel.find({ project: projectId })
                .populate('user', 'displayName email')
                .limit(10)
                .lean();
                
            const pages = await PageModel.find({ project: projectId }).lean();
            
            const variables = await VariableModel.find({ project: projectId }).lean();
            
            const blockInstances = await BlockInstanceModel.find({ project: projectId }).lean();
            
            return {
                ...projectObj,
                _id: projectObj._id as string,
                users: projectUsers as any[],
                pages: pages,
                variables: variables,
                blockInstances: blockInstances
            };
        } catch (error) {
            Logger.error(`Get project error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getProjectBySubdomain(subdomain: string): Promise<Project | null> {
        try {
            const project = await ProjectModel.findOne({ subdomain });
            if (!project) return null;
            
            const projectObj = project.toObject();
            return {
                ...projectObj,
                _id: projectObj._id as string
            };
        } catch (error) {
            Logger.error(`Get project by subdomain error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getUserProjects(
        userId: string, 
        options: ProjectQueryOptions = {}
    ): Promise<PaginatedResponse<Project>> {
        try {
            const { 
                search, 
                page = 1, 
                limit = 10, 
                sortBy = 'createdAt', 
                sortOrder = 'desc' 
            } = options;

            const projectUsers = await ProjectUserModel.find({ user: userId });
            const projectIds = projectUsers.map(pu => pu.project);

            const query: any = { _id: { $in: projectIds } };
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { subdomain: { $regex: search, $options: 'i' } } 
                ];
                
                if (mongoose.Types.ObjectId.isValid(search)) {
                    query.$or.push({ _id: search });
                }
            }

            const sort: any = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const paginateOptions = {
                page: Number(page),
                limit: Number(limit),
                sort,
                lean: true
            };

            const results = await ProjectModel.paginate(query, paginateOptions);
            
            return {
                docs: results.docs.map(project => ({
                    ...project,
                    _id: project._id as any
                })),
                totalDocs: results.totalDocs,
                limit: results.limit,
                totalPages: results.totalPages,
                page: results.page as any,
                pagingCounter: results.pagingCounter,
                hasPrevPage: results.hasPrevPage,
                hasNextPage: results.hasNextPage,
                prevPage: results.prevPage as any,
                nextPage: results.nextPage as any
            };
        } catch (error) {
            Logger.error(`Get user projects error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async updateProject(projectId: string, projectData: UpdateProjectDTO): Promise<Project | null> {
        try {
            if (projectData.subdomain) {
                const existingProject = await ProjectModel.findOne({
                    subdomain: projectData.subdomain,
                    _id: { $ne: projectId }
                });

                if (existingProject) {
                    throw new Error('Subdomain is already in use');
                }
            }

            const updatedProject = await ProjectModel.findByIdAndUpdate(
                projectId,
                { $set: projectData },
                { new: true }
            );

            if (!updatedProject) return null;
            
            const projectObj = updatedProject.toObject();
            return {
                ...projectObj,
                _id: projectObj._id as string
            };
        } catch (error) {
            Logger.error(`Update project error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async deleteProject(projectId: string): Promise<boolean> {
        try {
            const deleteResult = await ProjectModel.deleteOne({ _id: projectId });

            if (deleteResult.deletedCount === 0) {
                return false;
            }

            await ProjectUserModel.deleteMany({ project: projectId });

            return true;
        } catch (error) {
            Logger.error(`Delete project error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async syncProject(projectId: string, data: SyncProjectDTO): Promise<Record<string, any>> {
        try {
            const projectData = data.project;
            if (projectData) {
                await ProjectModel.findByIdAndUpdate(
                    projectId, 
                    { 
                        ...projectData,
                        updatedAt: new Date()
                    },
                    { new: true }
                );
            }
            
            const syncedPages: Record<string, any> = {};
            const deletedPages: string[] = [];
            
            const allExistingPages = await PageModel.find({ project: projectId });
            
            const incomingPageIds = new Set(
                (data.pages || []).map(page => page.page_id)
            );
            
            const pagesToDelete = allExistingPages.filter(
                page => !incomingPageIds.has(page.page_id)
            );
            
            for (const pageToDelete of pagesToDelete) {
                await PageModel.findByIdAndDelete(pageToDelete._id);
                deletedPages.push(pageToDelete.page_id);
            }
            
            if (data.pages && data.pages.length > 0) {
                
                const pagesByPageId = new Map();
                allExistingPages.forEach(page => {
                    pagesByPageId.set(page.page_id, page);
                });
                
                for (const pageData of data.pages) {
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
            
            const syncedVariables: Record<string, any> = {};
            const deletedVariables: string[] = [];
            
            const allExistingVariables = await VariableModel.find({ project: projectId });
            
            const incomingVariableIds = new Set(
                (data.variables || []).map(variable => variable.variable_id)
            );
            
            const variablesToDelete = allExistingVariables.filter(
                variable => !incomingVariableIds.has(variable.variable_id)
            );
            
            for (const variableToDelete of variablesToDelete) {
                await VariableModel.findByIdAndDelete(variableToDelete._id);
                deletedVariables.push(variableToDelete.variable_id);
            }
            
            if (data.variables && data.variables.length > 0) {
                for (const variableData of data.variables) {
                    const { variable_id, ...variableFields } = variableData;
                    
                    const existingVariable = await VariableModel.findOne({
                        project: projectId,
                        variable_id: variable_id
                    });
                    
                    if (existingVariable) {
                        const updatedVariable = await VariableModel.findByIdAndUpdate(
                            existingVariable._id,
                            {
                                ...variableFields,
                                updatedAt: new Date()
                            },
                            { new: true }
                        );
                        syncedVariables[variable_id] = updatedVariable;
                    } else {
                        const newVariable = new VariableModel({
                            ...variableFields,
                            variable_id: variable_id,
                            project: projectId
                        });
                        const savedVariable = await newVariable.save();
                        syncedVariables[variable_id] = savedVariable;
                    }
                }
            }
            
            const syncedBlocks: Record<string, any> = {};
            const deletedBlocks: string[] = [];
            
            const allExistingBlocks = await BlockInstanceModel.find({ project: projectId });
            
            const incomingBlockIds = new Set(
                (data.blocks || []).map(block => block.instance_id || '')
            );
            
            const blocksToDelete = allExistingBlocks.filter(
                block => !block.instance_id || !incomingBlockIds.has(block.instance_id)
            );
            
            for (const blockToDelete of blocksToDelete) {
                await BlockInstanceModel.findByIdAndDelete(blockToDelete._id);
                const blockId = blockToDelete.instance_id || (blockToDelete._id ? blockToDelete._id.toString() : '');
                deletedBlocks.push(blockId);
            }
            
            if (data.blocks && data.blocks.length > 0) {
                
                const pageIdToObjectMap = new Map<string, mongoose.Types.ObjectId>();
                const pagesForProject = await PageModel.find({ project: projectId });
                
                for (const page of pagesForProject) {
                    if (page._id && page.page_id) {
                        //@ts-ignore
                        pageIdToObjectMap.set(page.page_id, page._id);
                    }
                }
                
                const instanceIdToObjectMap = new Map<string, mongoose.Types.ObjectId>();
                for (const block of allExistingBlocks) {
                    if (block.instance_id && block._id) {
                        //@ts-ignore
                        instanceIdToObjectMap.set(block.instance_id, block._id);
                    }
                }
                
                for (const blockData of data.blocks) {
                    interface BlockDataWithInstanceId {
                        instance_id?: string;
                        page_id: string; 
                        index: number;
                        page: string; 
                        folderName: string;
                        subFolder: string;
                        value?: any;
                        instance?: string | null;
                    }
                    
                    const typedBlockData = blockData as BlockDataWithInstanceId;
                    const { instance_id, page_id, page, index, folderName, subFolder, value, instance } = typedBlockData;
                    
                    const lookupPageId = page_id || page;
                    
                    const pageObjectId = pageIdToObjectMap.get(lookupPageId);
                    
                    const instanceObjectId = instance ? instanceIdToObjectMap.get(instance) : null;
                    
                    if (!pageObjectId) {
                        console.warn(`Page with page_id ${lookupPageId} not found for block. Creating placeholder page.`);
                        
                        const placeholderPage = new PageModel({
                            name: `Page ${lookupPageId}`,
                            path: '/placeholder',
                            isStatic: true,
                            project: projectId,
                            page_id: lookupPageId
                        });
                        
                        const savedPage = await placeholderPage.save();
                        //@ts-ignore
                        pageIdToObjectMap.set(lookupPageId, savedPage?._id);
                        
                        const blockFields = {
                            instance_id: instance_id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            page_id: lookupPageId, // Always preserve the frontend page_id
                            index,
                            page: savedPage._id, // Use the MongoDB reference
                            folderName,
                            subFolder,
                            value,
                            instance: instanceObjectId,
                            project: projectId
                        };
                        
                        // Continue with block creation logic
                        const existingBlock = instance_id ? 
                            await BlockInstanceModel.findOne({ instance_id }) : null;
                        
                        if (existingBlock) {
                            const updatedBlock = await BlockInstanceModel.findByIdAndUpdate(
                                existingBlock._id,
                                {
                                    ...blockFields,
                                    updatedAt: new Date()
                                },
                                { new: true }
                            );
                            if (blockFields.instance_id) {
                                syncedBlocks[blockFields.instance_id] = updatedBlock;
                            }
                        } else {
                            const newBlock = new BlockInstanceModel(blockFields);
                            const savedBlock = await newBlock.save();
                            syncedBlocks[blockFields.instance_id] = savedBlock;
                        }
                        continue;
                    }
                    
                    // If the page exists, proceed with the normal flow
                    const blockFields = {
                        instance_id: instance_id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        page_id: lookupPageId, // Always preserve the frontend page_id
                        index,
                        page: pageObjectId, // Use the MongoDB ObjectId for the page reference
                        folderName,
                        subFolder,
                        value,
                        instance: instanceObjectId,
                        project: projectId
                    };
                    
                    const existingBlock = instance_id ? 
                        await BlockInstanceModel.findOne({ instance_id }) : null;
                    
                    if (existingBlock) {
                        const updatedBlock = await BlockInstanceModel.findByIdAndUpdate(
                            existingBlock._id,
                            {
                                ...blockFields,
                                updatedAt: new Date()
                            },
                            { new: true }
                        );
                        if (instance_id) {
                            syncedBlocks[instance_id] = updatedBlock;
                        }
                    } else {
                        const newBlock = new BlockInstanceModel({
                            ...blockFields,
                            instance_id: instance_id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        });
                        const savedBlock = await newBlock.save();
                        //@ts-ignore
                        syncedBlocks[instance_id] = savedBlock;
                    }
                }
            }
            
            return {
                project: projectData,
                pages: {
                    updated: Object.keys(syncedPages).length,
                    deleted: deletedPages.length,
                    items: syncedPages
                },
                variables: {
                    updated: Object.keys(syncedVariables).length,
                    deleted: deletedVariables.length,
                    items: syncedVariables
                },
                blocks: {
                    updated: Object.keys(syncedBlocks).length,
                    deleted: deletedBlocks.length,
                    items: syncedBlocks
                }
            };
        } catch (error) {
            Logger.error(`Project sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}