export type ProjectData = {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export type PageData = {
  id: string;
  name: string;
  path?: string;
  slug?: string;
  route?: string;
  isStatic?: boolean;
  project?: ProjectData;
  createdAt: string;
  updatedAt: string;
}

export type VariableSet = {
  id: string;
  name: string;
  slug: string;
  project: ProjectData;
  createdAt: string;
  updatedAt: string;
}

export type Variable = {
  id: string;
  name: string;
  slug: string;
  type: "color" | "text" | "number" | "boolean";
  value: string;
  variableSet: VariableSet;
  createdAt: string;
  updatedAt: string;
}