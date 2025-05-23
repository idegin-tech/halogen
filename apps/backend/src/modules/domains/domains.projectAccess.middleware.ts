import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '../../types/api.types';
import { ProjectUserStatus } from '@halogen/common';
import { ProjectUserModel } from '../project-users';
import DomainModel from '../domains/domains.model';
import Logger from '../../config/logger.config';

/**
 * Middleware to ensure user has access to the project associated with a domain
 * This middleware is useful for endpoints that receive domainId but don't have projectId in the URL
 */
export const requireDomainProjectAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session || !req.session.userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
    }

    try {
        // For POST requests, check body
        const domainId = req.method === 'POST' ? req.body?.domainId : req.params?.domainId;

        if (!domainId) {
            res.status(400).json(createErrorResponse('Domain ID is required'));
            return;
        }

        // Find the domain to get its project
        const domain = await DomainModel.findById(domainId);
        if (!domain) {
            res.status(404).json(createErrorResponse('Domain not found'));
            return;
        }

        // Now check if user has access to the project
        const projectUser = await ProjectUserModel.findOne({
            project: domain.project,
            user: req.session.userId,
            status: ProjectUserStatus.ACTIVE
        });

        if (!projectUser) {
            Logger.warn(`User ${req.session.userId} attempted to access domain ${domainId} for project ${domain.project} without permission`);
            res.status(403).json(createErrorResponse('You do not have access to this project'));
            return;
        }

        req.user = {
            id: req.session.userId
        };

        next();
    } catch (error) {
        Logger.error(`Domain project access check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        res.status(500).json(createErrorResponse('Failed to verify project access'));
    }
};
