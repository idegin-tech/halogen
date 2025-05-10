import VariableModel from './variables.model';
import Logger from '../../../config/logger.config';

export class VariablesService {
    static async syncVariables(
        projectId: string, 
        variables: any[] = []
    ): Promise<{ syncedVariables: Record<string, any>; deletedVariables: string[] }> {
        try {
            const syncedVariables: Record<string, any> = {};
            const deletedVariables: string[] = [];
            
            const allExistingVariables = await VariableModel.find({ project: projectId });
            
            const incomingVariableIds = new Set(
                variables.map(variable => variable.variable_id)
            );
            
            const variablesToDelete = allExistingVariables.filter(
                variable => !incomingVariableIds.has(variable.variable_id)
            );
            
            for (const variableToDelete of variablesToDelete) {
                await VariableModel.findByIdAndDelete(variableToDelete._id);
                deletedVariables.push(variableToDelete.variable_id);
            }
            
            if (variables.length > 0) {
                for (const variableData of variables) {
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
            
            return { 
                syncedVariables, 
                deletedVariables
            };
        } catch (error) {
            Logger.error(`Variables sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
