import { Train } from './trains.models';

export interface TrainsResponse {
  data: {
    items: Train[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    hasMore: boolean;
  };
}
