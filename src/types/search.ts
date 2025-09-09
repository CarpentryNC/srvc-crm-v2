export type SearchResultType = 'customer' | 'job' | 'quote' | 'invoice';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  url: string;
  avatar?: string;
  status?: string;
  updatedAt: string;
}

export interface RecentActivity {
  id: string;
  type: SearchResultType;
  entityId: string;
  entityTitle: string;
  action: string;
  timestamp: string;
  url: string;
}

export interface SearchFilters {
  types: SearchResultType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
