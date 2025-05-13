export interface ProjectMetadata {
  _id?: string;
  project: string;
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  favicon?: string;
  appleTouchIcon?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMetadataDTO {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  favicon?: string;
  appleTouchIcon?: string;
}
