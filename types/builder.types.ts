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
  createdAt?: string;
  updatedAt?: string;
}

export type VariableSet = {
  id: string;
  name: string;
  key: string;
  project?: string | ProjectData;
  createdAt?: string;
  updatedAt?: string;
}

export type Variable = {
  id: string;
  name: string;
  key: string;
  type: "color" | "text" | "uom" | "boolean";
  project?: string | ProjectData;
  primaryValue: string;
  secondaryValue: string;
  variableSet: VariableSet | string;
  createdAt?: string;
  updatedAt?: string;
}