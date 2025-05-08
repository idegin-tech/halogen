import { Project, ProjectUserRole } from '@halogen/common';
import { generateUsername } from 'unique-username-generator';
import { CreateProjectDTO, UpdateProjectDTO } from './projects.dtos';
import ProjectModel from './projects.model';
import ProjectUserModel from '../project-users/project-users.model';
import Logger from '../../config/logger.config';

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
                user: userId,
                isPublished: false
            });

            const savedProject = await newProject.save();

            const projectUser = new ProjectUserModel({
                project: savedProject._id as string,
                user: userId,
                role: ProjectUserRole.OWNER
            });

            await projectUser.save();

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

    static async getProjectById(projectId: string): Promise<Project | null> {
        try {
            const project = await ProjectModel.findById(projectId);
            if (!project) return null;
            
            const projectObj = project.toObject();
            return {
                ...projectObj,
                _id: projectObj._id as string
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

    static async getUserProjects(userId: string): Promise<Project[]> {
        try {
            const projectUsers = await ProjectUserModel.find({ user: userId });
            const projectIds = projectUsers.map(pu => pu.project);

            const projects = await ProjectModel.find({ _id: { $in: projectIds } });

            return projects.map(project => {
                const projectObj = project.toObject();
                return {
                    ...projectObj,
                    _id: projectObj._id as string
                };
            });
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
}