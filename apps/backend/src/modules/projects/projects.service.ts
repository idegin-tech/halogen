import { ProjectData, ProjectUserRole, PaginatedResponse, ProjectQueryOptions } from '@halogen/common';
import { generateUsername } from 'unique-username-generator';
import { CreateProjectDTO, UpdateProjectDTO, SyncProjectDTO } from './projects.dtos';
import ProjectModel from './projects.model';
import ProjectUserModel from '../project-users/project-users.model';
import Logger from '../../config/logger.config';
import mongoose from 'mongoose';
import PageModel from '../artifacts/pages/pages.model';
import VariableModel from '../artifacts/variables/variables.model';
import BlockInstanceModel from '../artifacts/block-instance/block-instances.model';
import { ProjectMetadataService } from '../project-metadata';

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

    static async createProject(userId: string, projectData: CreateProjectDTO): Promise<ProjectData> {
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

            const homePage = new PageModel({
                name: 'Home',
                path: '/',
                isStatic: true,
                project: savedProject._id,
                page_id: homePageId
            });

            await homePage.save();

            if (pagesData && pagesData.length > 0) {
                for (const pageData of pagesData) {
                    if (pageData.path === '/') continue;

                    const page = new PageModel({
                        ...pageData,
                        project: savedProject._id
                    });

                    await page.save();
                }
            }             const defaultMetadata = {
                project: savedProject._id?.toString() || '',
                title: projectFields.name,
                description: projectFields.description || ''
            };

            await ProjectMetadataService.createProjectMetadata(defaultMetadata);

            const projectObj = savedProject.toObject();
            return {
                ...projectObj,
                _id: projectObj._id as string
            };
        } catch (error) {
            Logger.error(`Create project error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    } static async getProjectById(projectId: string) {
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
    } static async getProjectBySubdomain(subdomain: string): Promise<ProjectData | null> {
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
    ): Promise<PaginatedResponse<ProjectData>> {
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
            }; const results = await ProjectModel.paginate(query, paginateOptions);

            return {
                docs: results.docs.map(project => {
                    return {
                        ...project,
                        _id: project._id as any
                    };
                }),
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

    static async updateProject(projectId: string, projectData: UpdateProjectDTO): Promise<ProjectData | null> {
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
    } static async deleteProject(projectId: string): Promise<boolean> {
        try {
            const deleteResult = await ProjectModel.deleteOne({ _id: projectId });

            if (deleteResult.deletedCount === 0) {
                return false;
            }

            // Also delete related data
            await ProjectUserModel.deleteMany({ project: projectId });

            // Delete project metadata if exists
            await ProjectMetadataService.deleteProjectMetadataByProjectId(projectId);

            return true;
        } catch (error) {
            Logger.error(`Delete project error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    } static async syncProject(projectId: string, data: SyncProjectDTO): Promise<Record<string, any>> {
        try {
            // Update project data
            const projectData = data.project;
            if (!projectData) {
                throw new Error('Project data is required');
            }

            const updatedProject = await ProjectModel.findByIdAndUpdate(
                projectId,
                {
                    ...projectData,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!updatedProject) {
                throw new Error('Project not found');
            }

            return {
                project: updatedProject.toObject(),
            };
        } catch (error) {
            Logger.error(`Project sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}