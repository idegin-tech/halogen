/**
 * Project Settings types - settings for a project such as fonts
 */

export interface ProjectSettings {
  _id?: string;
  project: string;
  headingFont: string;
  bodyFont: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectSettingsDTO {
  headingFont?: string;
  bodyFont?: string;
}
