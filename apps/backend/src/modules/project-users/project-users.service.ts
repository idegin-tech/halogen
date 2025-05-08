import {
    ProjectUser,
    ProjectUserStatus,
    PaginatedResponse,
    ProjectUserQueryOptions
} from '@halogen/common';
import mongoose from 'mongoose';
import { CreateProjectUserDTO, UpdateProjectUserDTO } from './project-users.dtos';
import ProjectUserModel from './project-users.model';
import ProjectModel from '../projects/projects.model';
import UserModel from '../users/users.model';
import Logger from '../../config/logger.config';

export class ProjectUserService {
    static async createProjectUser(projectUserData: CreateProjectUserDTO): Promise<ProjectUser> {
        try {
            const projectExists = await ProjectModel.exists({ _id: projectUserData.project });
            if (!projectExists) {
                throw new Error('Project does not exist');
            }

            const userExists = await UserModel.exists({ _id: projectUserData.user });
            if (!userExists) {
                throw new Error('User does not exist');
            }

            if (!projectUserData.status) {
                projectUserData.status = ProjectUserStatus.ACTIVE;
            }

            const newProjectUser = new ProjectUserModel(projectUserData);
            const savedProjectUser = await newProjectUser.save();

            const projectUserObj = savedProjectUser.toObject();
            return {
                ...projectUserObj,
                _id: projectUserObj._id as string
            };
        } catch (error) {
            Logger.error(`Create project user error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getProjectUserById(id: string): Promise<ProjectUser | null> {
        try {
            const projectUser = await ProjectUserModel.findById(id);
            if (!projectUser) return null;

            const projectUserObj = projectUser.toObject();
            return {
                ...projectUserObj,
                _id: projectUserObj._id as string
            };
        } catch (error) {
            Logger.error(`Get project user error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getProjectUsers(
        projectId: string,
        options: ProjectUserQueryOptions = {}
    ): Promise<PaginatedResponse<ProjectUser>> {
        try {
            const {
                search,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                status
            } = options;

            const query: any = { project: projectId };

            if (status) {
                if (Array.isArray(status)) {
                    query.status = { $in: status };
                } else {
                    query.status = status;
                }
            }

            let aggregate = [];

            if (search) {
                aggregate.push(
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $unwind: '$userDetails'
                    },
                    {
                        $match: {
                            project: new mongoose.Types.ObjectId(projectId),
                            $or: [
                                { 'userDetails.name': { $regex: search, $options: 'i' } },
                                { 'userDetails.email': { $regex: search, $options: 'i' } },
                                { role: { $regex: search, $options: 'i' } },
                                { status: { $regex: search, $options: 'i' } }
                            ]
                        }
                    }
                );

                if (status) {
                    if (Array.isArray(status)) {
                        // @ts-ignore
                        aggregate[2].$match.status = { $in: status };
                    } else {
                        // @ts-ignore
                        aggregate[2].$match.status = status;
                    }
                }

                const options = {
                    page: Number(page),
                    limit: Number(limit),
                    sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
                };

                // @ts-ignore
                const results = await ProjectUserModel.aggregatePaginate(
                    ProjectUserModel.aggregate(aggregate),
                    options
                );

                return {
                    docs: results.docs.map((doc: any) => ({
                        ...doc,
                        _id: doc._id.toString(),
                        user: doc.user.toString(),
                        project: doc.project.toString()
                    })),
                    totalDocs: results.totalDocs,
                    limit: results.limit,
                    totalPages: results.totalPages,
                    page: results.page,
                    pagingCounter: results.pagingCounter,
                    hasPrevPage: results.hasPrevPage,
                    hasNextPage: results.hasNextPage,
                    prevPage: results.prevPage,
                    nextPage: results.nextPage
                };
            } else {
                const paginateOptions = {
                    page: Number(page),
                    limit: Number(limit),
                    sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
                    lean: true,
                    populate: {
                        path: 'user',
                        select: 'name email'
                    }
                };

                const results = await ProjectUserModel.paginate(query, paginateOptions);

                return {
                    docs: results.docs.map(doc => ({
                        ...doc,
                        _id: doc._id as any,
                        // @ts-ignore
                        user: typeof doc.user === 'object' ? doc.user._id as any : doc.user.toString(),
                        project: doc.project.toString()
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
            }
        } catch (error) {
            Logger.error(`Get project users error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async updateProjectUser(id: string, updateData: UpdateProjectUserDTO): Promise<ProjectUser | null> {
        try {
            const updatedProjectUser = await ProjectUserModel.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            );

            if (!updatedProjectUser) return null;

            const projectUserObj = updatedProjectUser.toObject();
            return {
                ...projectUserObj,
                _id: projectUserObj._id as string
            };
        } catch (error) {
            Logger.error(`Update project user error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async deleteProjectUser(id: string): Promise<boolean> {
        try {
            const deleteResult = await ProjectUserModel.deleteOne({ _id: id });
            return deleteResult.deletedCount === 1;
        } catch (error) {
            Logger.error(`Delete project user error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async deleteProjectUsers(projectId: string): Promise<number> {
        try {
            const deleteResult = await ProjectUserModel.deleteMany({ project: projectId });
            return deleteResult.deletedCount || 0;
        } catch (error) {
            Logger.error(`Delete project users error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}