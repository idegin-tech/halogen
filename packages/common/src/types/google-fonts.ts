

export interface GoogleFontItem {
  family: string;
  variants: string[];
  category: string;
}

export interface PaginatedFontsResponse {
  items: GoogleFontItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

export interface FontOption {
  name: string;
  value: string;
  category: 'heading' | 'body';
}
