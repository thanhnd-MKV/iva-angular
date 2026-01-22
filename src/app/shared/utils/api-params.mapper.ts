/**
 * Utility to map UI search parameters to API query parameters
 * Used across all event/tracking screens for consistent API calls
 */

export interface UISearchParams {
  startDate?: string;
  endDate?: string;
  threshold?: number;
  gender?: string;
  camera?: string;
  [key: string]: any;
}

export interface APIQueryParams {
  isSuspect?: string;
  personId?: string;
  recognitionThreshold?: number;
  gender?: string;
  cameraSn?: string;
  fromUtc?: string;
  toUtc?: string;
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

/**
 * Map UI search parameters to API query parameters
 * 
 * @param searchParams - Parameters from event-search-bar component
 * @param options - Additional options like personId, page, pageSize
 * @returns Mapped API query parameters
 * 
 * @example
 * const apiParams = mapSearchParamsToAPI(searchParams, { personId: '1', page: 0 });
 * // Result: { isSuspect: 'true', personId: '1', recognitionThreshold: 0.7, gender: 'male', fromUtc: '...', toUtc: '...' }
 */
export function mapSearchParamsToAPI(
  searchParams: UISearchParams,
  options?: {
    personId?: string;
    page?: number;
    pageSize?: number;
    includeSuspectFilter?: boolean;
  }
): APIQueryParams {
  console.log('🔧 mapSearchParamsToAPI called with:', { searchParams, options });
  
  const apiParams: APIQueryParams = {};

  // Add suspect filter if requested
  if (options?.includeSuspectFilter) {
    apiParams.isSuspect = 'true';
  }

  // Add personId if provided
  if (options?.personId) {
    apiParams.personId = options.personId;
  }

  // Add pagination
  if (options?.page !== undefined) {
    apiParams.page = options.page;
  }
  if (options?.pageSize !== undefined) {
    apiParams.pageSize = options.pageSize;
  }

  // Map threshold (from slider, 0-1)
  if (searchParams.threshold !== undefined) {
    apiParams.recognitionThreshold = searchParams.threshold;
    console.log('✅ Mapped threshold:', searchParams.threshold, '→', apiParams.recognitionThreshold);
  }

  // Map gender
  if (searchParams.gender) {
    apiParams.gender = searchParams.gender;
    console.log('✅ Mapped gender:', searchParams.gender);
  }

  // Map camera (camera -> cameraSn)
  if (searchParams.camera) {
    apiParams.cameraSn = searchParams.camera;
    console.log('✅ Mapped camera:', searchParams.camera, '→', apiParams.cameraSn);
  }

  // Map date range to UTC format
  if (searchParams.startDate) {
    console.log('📅 Processing startDate:', searchParams.startDate, typeof searchParams.startDate);
    const startDateObj = new Date(searchParams.startDate);
    // Set to start of day UTC
    startDateObj.setUTCHours(0, 0, 0, 0);
    apiParams.fromUtc = startDateObj.toISOString();
    console.log('✅ Mapped startDate:', searchParams.startDate, '→', apiParams.fromUtc);
  } else {
    console.log('⚠️ No startDate in searchParams');
  }

  if (searchParams.endDate) {
    console.log('📅 Processing endDate:', searchParams.endDate, typeof searchParams.endDate);
    const endDateObj = new Date(searchParams.endDate);
    // Set to end of day UTC
    endDateObj.setUTCHours(23, 59, 59, 999);
    apiParams.toUtc = endDateObj.toISOString();
    console.log('✅ Mapped endDate:', searchParams.endDate, '→', apiParams.toUtc);
  } else {
    console.log('⚠️ No endDate in searchParams');
  }

  console.log('🎯 Final apiParams:', apiParams);
  return apiParams;
}

/**
 * Example usage in components:
 * 
 * ```typescript
 * import { mapSearchParamsToAPI } from '../../shared/utils/api-params.mapper';
 * 
 * onSearch(searchParams: any) {
 *   const apiParams = mapSearchParamsToAPI(searchParams, {
 *     personId: this.objectId,
 *     page: 0,
 *     pageSize: 50,
 *     includeSuspectFilter: true
 *   });
 *   
 *   this.objectService.getRelatedEvents(this.objectId, apiParams).subscribe(...);
 * }
 * ```
 */
