import { Project, ProjectUserRole, PaginatedResponse, ProjectQueryOptions } from '@halogen/common';
import { generateUsername } from 'unique-username-generator';
import { CreateProjectDTO, UpdateProjectDTO, SyncProjectDTO } from './projects.dtos';
import ProjectModel from './projects.model';
import ProjectUserModel from '../project-users/project-users.model';
import Logger from '../../config/logger.config';
import mongoose from 'mongoose';
import PageModel from '../artifacts/pages/pages.model';

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

            const newProject = new ProjectModel({
                ...projectData,
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
            
            const homePage = new PageModel({
                name: 'Home',
                path: '/',
                isStatic: true,
                project: savedProject._id
            });
            
            await homePage.save();

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
            
            const variables = await mongoose.model('Variable').find({ project: projectId }).lean();
            
            const blockInstances = await mongoose.model('BlockInstance').find({ project: projectId }).lean();
            
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
            if (data.pages && data.pages.length > 0) {
                for (const pageData of data.pages) {
                    const { page_id, ...pageFields } = pageData;
                    
                    const existingPage = await PageModel.findOne({ 
                        project: projectId,
                        id: page_id
                    });
                    
                    if (existingPage) {
                        const updatedPage = await PageModel.findByIdAndUpdate(
                            existingPage._id,
                            {
                                ...pageFields,
                                updatedAt: new Date()
                            },
                            { new: true }
                        );
                        syncedPages[page_id] = updatedPage;
                    } else {
                        const newPage = new PageModel({
                            ...pageFields,
                            id: page_id,
                            project: projectId
                        });
                        const savedPage = await newPage.save();
                        syncedPages[page_id] = savedPage;
                    }
                }
            }
            
            const syncedVariables: Record<string, any> = {};
            if (data.variables && data.variables.length > 0) {
                const VariableModel = mongoose.model('Variable');
                
                for (const variableData of data.variables) {
                    const { variable_id, ...variableFields } = variableData;
                    
                    const existingVariable = await VariableModel.findOne({
                        project: projectId,
                        id: variable_id
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
                            id: variable_id,
                            project: projectId
                        });
                        const savedVariable = await newVariable.save();
                        syncedVariables[variable_id] = savedVariable;
                    }
                }
            }
            
            const syncedBlocks: Record<string, any> = {};
            if (data.blocks && data.blocks.length > 0) {
                const BlockInstanceModel = mongoose.model('BlockInstance');
                
                const existingBlocks = await BlockInstanceModel.find({ project: projectId });
                const existingBlocksMap = new Map(
                    existingBlocks.map(block => [
                        `${block.page}-${block.index}-${block.folderName}-${block.subFolder}`,
                        block
                    ])
                );
                
                for (const blockData of data.blocks) {
                    const { page, index, folderName, subFolder, ...blockFields } = blockData;
                    
                    const blockKey = `${page}-${index}-${folderName}-${subFolder}`;
                    
                    if (existingBlocksMap.has(blockKey)) {
                        const existingBlock = existingBlocksMap.get(blockKey);
                        const updatedBlock = await BlockInstanceModel.findByIdAndUpdate(
                            existingBlock._id,
                            {
                                ...blockFields,
                                updatedAt: new Date()
                            },
                            { new: true }
                        );
                        syncedBlocks[blockKey] = updatedBlock;
                    } else {
                        const newBlock = new BlockInstanceModel({
                            page,
                            index,
                            folderName,
                            subFolder,
                            ...blockFields,
                            project: projectId
                        });
                        const savedBlock = await newBlock.save();
                        syncedBlocks[blockKey] = savedBlock;
                    }
                }
            }
            
            return {
                message: 'Project data synchronized successfully',
                projectId,
                pages: syncedPages,
                variables: syncedVariables,
                blocks: syncedBlocks
            };
        } catch (error) {
            Logger.error(`Project sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}