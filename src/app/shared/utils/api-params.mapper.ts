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
  suspectId?: string;
  recognitionThreshold?: number;
  gender?: string;
  cameraSn?: string;
  fromUtc?: string;
  toUtc?: string;
  page?: number;
  size?: number;
  [key: string]: any;
}

/**
 * Map UI search parameters to API query parameters
 * 
 * @param searchParams - Parameters from event-search-bar component
 * @param options - Additional options like , page, pageSize
 * @returns Mapped API query parameters
 * 
 * @example
 */
export function mapSearchParamsToAPI(
  searchParams: UISearchParams,
  options?: {
    suspectId?: string;
    page?: number;
    size?: number;
    includeSuspectFilter?: boolean;
  }
): APIQueryParams {
  console.log('🔧 mapSearchParamsToAPI called with:', { searchParams, options });
  
  const apiParams: APIQueryParams = {};

  // Add suspect filter if requested
  if (options?.includeSuspectFilter) {
    apiParams.isSuspect = 'true';
  }

  // Add suspectId if provided
  if (options?.suspectId) {
    apiParams.suspectId = options.suspectId;
  }

  // Add pagination
  if (options?.page !== undefined) {
    apiParams.page = options.page;
  }
  if (options?.size !== undefined) {
    apiParams.size = options.size;
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

