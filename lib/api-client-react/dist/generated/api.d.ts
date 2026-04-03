import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { CountryStatsResponse, CreateIncidentRequest, DashboardStats, ErrorResponse, ExportReportParams, ExportedReport, GenerateReportRequest, HealthStatus, Incident, IncidentListResponse, ListIncidentsParams, ListReportsParams, ListThreatAssessmentsParams, Logout200, Report, ReportListResponse, ScrapeResult, ScraperStatus, ThreatAssessment, ThreatAssessmentListResponse, TrendingRegionsResponse, UserProfile } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get user profile and settings
 */
export declare const getGetProfileUrl: () => string;
export declare const getProfile: (options?: RequestInit) => Promise<UserProfile>;
export declare const getGetProfileQueryKey: () => readonly ["/api/profile"];
export declare const getGetProfileQueryOptions: <TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getProfile>>>;
export type GetProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get user profile and settings
 */
export declare function useGetProfile<TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update user profile and settings
 */
export declare const getUpdateProfileUrl: () => string;
export declare const updateProfile: (userProfile: UserProfile, options?: RequestInit) => Promise<UserProfile>;
export declare const getUpdateProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
        data: BodyType<UserProfile>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
    data: BodyType<UserProfile>;
}, TContext>;
export type UpdateProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateProfile>>>;
export type UpdateProfileMutationBody = BodyType<UserProfile>;
export type UpdateProfileMutationError = ErrorType<unknown>;
/**
 * @summary Update user profile and settings
 */
export declare const useUpdateProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
        data: BodyType<UserProfile>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProfile>>, TError, {
    data: BodyType<UserProfile>;
}, TContext>;
/**
 * @summary Logout user
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<Logout200>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Logout user
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary List incidents with filters
 */
export declare const getListIncidentsUrl: (params?: ListIncidentsParams) => string;
export declare const listIncidents: (params?: ListIncidentsParams, options?: RequestInit) => Promise<IncidentListResponse>;
export declare const getListIncidentsQueryKey: (params?: ListIncidentsParams) => readonly ["/api/incidents", ...ListIncidentsParams[]];
export declare const getListIncidentsQueryOptions: <TData = Awaited<ReturnType<typeof listIncidents>>, TError = ErrorType<unknown>>(params?: ListIncidentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listIncidents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listIncidents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListIncidentsQueryResult = NonNullable<Awaited<ReturnType<typeof listIncidents>>>;
export type ListIncidentsQueryError = ErrorType<unknown>;
/**
 * @summary List incidents with filters
 */
export declare function useListIncidents<TData = Awaited<ReturnType<typeof listIncidents>>, TError = ErrorType<unknown>>(params?: ListIncidentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listIncidents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new incident
 */
export declare const getCreateIncidentUrl: () => string;
export declare const createIncident: (createIncidentRequest: CreateIncidentRequest, options?: RequestInit) => Promise<Incident>;
export declare const getCreateIncidentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createIncident>>, TError, {
        data: BodyType<CreateIncidentRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createIncident>>, TError, {
    data: BodyType<CreateIncidentRequest>;
}, TContext>;
export type CreateIncidentMutationResult = NonNullable<Awaited<ReturnType<typeof createIncident>>>;
export type CreateIncidentMutationBody = BodyType<CreateIncidentRequest>;
export type CreateIncidentMutationError = ErrorType<unknown>;
/**
 * @summary Create a new incident
 */
export declare const useCreateIncident: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createIncident>>, TError, {
        data: BodyType<CreateIncidentRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createIncident>>, TError, {
    data: BodyType<CreateIncidentRequest>;
}, TContext>;
/**
 * @summary Get incident by ID
 */
export declare const getGetIncidentUrl: (id: number) => string;
export declare const getIncident: (id: number, options?: RequestInit) => Promise<Incident>;
export declare const getGetIncidentQueryKey: (id: number) => readonly [`/api/incidents/${number}`];
export declare const getGetIncidentQueryOptions: <TData = Awaited<ReturnType<typeof getIncident>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getIncident>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getIncident>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetIncidentQueryResult = NonNullable<Awaited<ReturnType<typeof getIncident>>>;
export type GetIncidentQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get incident by ID
 */
export declare function useGetIncident<TData = Awaited<ReturnType<typeof getIncident>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getIncident>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Generate AI threat assessment for an incident
 */
export declare const getAssessIncidentUrl: (id: number) => string;
export declare const assessIncident: (id: number, options?: RequestInit) => Promise<ThreatAssessment>;
export declare const getAssessIncidentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof assessIncident>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof assessIncident>>, TError, {
    id: number;
}, TContext>;
export type AssessIncidentMutationResult = NonNullable<Awaited<ReturnType<typeof assessIncident>>>;
export type AssessIncidentMutationError = ErrorType<unknown>;
/**
 * @summary Generate AI threat assessment for an incident
 */
export declare const useAssessIncident: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof assessIncident>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof assessIncident>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List threat assessments
 */
export declare const getListThreatAssessmentsUrl: (params?: ListThreatAssessmentsParams) => string;
export declare const listThreatAssessments: (params?: ListThreatAssessmentsParams, options?: RequestInit) => Promise<ThreatAssessmentListResponse>;
export declare const getListThreatAssessmentsQueryKey: (params?: ListThreatAssessmentsParams) => readonly ["/api/threats", ...ListThreatAssessmentsParams[]];
export declare const getListThreatAssessmentsQueryOptions: <TData = Awaited<ReturnType<typeof listThreatAssessments>>, TError = ErrorType<unknown>>(params?: ListThreatAssessmentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listThreatAssessments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listThreatAssessments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListThreatAssessmentsQueryResult = NonNullable<Awaited<ReturnType<typeof listThreatAssessments>>>;
export type ListThreatAssessmentsQueryError = ErrorType<unknown>;
/**
 * @summary List threat assessments
 */
export declare function useListThreatAssessments<TData = Awaited<ReturnType<typeof listThreatAssessments>>, TError = ErrorType<unknown>>(params?: ListThreatAssessmentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listThreatAssessments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Generate an intelligence report
 */
export declare const getGenerateReportUrl: () => string;
export declare const generateReport: (generateReportRequest: GenerateReportRequest, options?: RequestInit) => Promise<Report>;
export declare const getGenerateReportMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateReport>>, TError, {
        data: BodyType<GenerateReportRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateReport>>, TError, {
    data: BodyType<GenerateReportRequest>;
}, TContext>;
export type GenerateReportMutationResult = NonNullable<Awaited<ReturnType<typeof generateReport>>>;
export type GenerateReportMutationBody = BodyType<GenerateReportRequest>;
export type GenerateReportMutationError = ErrorType<unknown>;
/**
 * @summary Generate an intelligence report
 */
export declare const useGenerateReport: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateReport>>, TError, {
        data: BodyType<GenerateReportRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateReport>>, TError, {
    data: BodyType<GenerateReportRequest>;
}, TContext>;
/**
 * @summary List generated reports
 */
export declare const getListReportsUrl: (params?: ListReportsParams) => string;
export declare const listReports: (params?: ListReportsParams, options?: RequestInit) => Promise<ReportListResponse>;
export declare const getListReportsQueryKey: (params?: ListReportsParams) => readonly ["/api/reports", ...ListReportsParams[]];
export declare const getListReportsQueryOptions: <TData = Awaited<ReturnType<typeof listReports>>, TError = ErrorType<unknown>>(params?: ListReportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListReportsQueryResult = NonNullable<Awaited<ReturnType<typeof listReports>>>;
export type ListReportsQueryError = ErrorType<unknown>;
/**
 * @summary List generated reports
 */
export declare function useListReports<TData = Awaited<ReturnType<typeof listReports>>, TError = ErrorType<unknown>>(params?: ListReportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Export report as text
 */
export declare const getExportReportUrl: (id: number, params?: ExportReportParams) => string;
export declare const exportReport: (id: number, params?: ExportReportParams, options?: RequestInit) => Promise<ExportedReport>;
export declare const getExportReportQueryKey: (id: number, params?: ExportReportParams) => readonly [`/api/reports/${number}/export`, ...ExportReportParams[]];
export declare const getExportReportQueryOptions: <TData = Awaited<ReturnType<typeof exportReport>>, TError = ErrorType<unknown>>(id: number, params?: ExportReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof exportReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ExportReportQueryResult = NonNullable<Awaited<ReturnType<typeof exportReport>>>;
export type ExportReportQueryError = ErrorType<unknown>;
/**
 * @summary Export report as text
 */
export declare function useExportReport<TData = Awaited<ReturnType<typeof exportReport>>, TError = ErrorType<unknown>>(id: number, params?: ExportReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Manually trigger news scraping
 */
export declare const getTriggerScrapeUrl: () => string;
export declare const triggerScrape: (options?: RequestInit) => Promise<ScrapeResult>;
export declare const getTriggerScrapeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof triggerScrape>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof triggerScrape>>, TError, void, TContext>;
export type TriggerScrapeMutationResult = NonNullable<Awaited<ReturnType<typeof triggerScrape>>>;
export type TriggerScrapeMutationError = ErrorType<unknown>;
/**
 * @summary Manually trigger news scraping
 */
export declare const useTriggerScrape: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof triggerScrape>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof triggerScrape>>, TError, void, TContext>;
/**
 * @summary Get current scraper status
 */
export declare const getGetScraperStatusUrl: () => string;
export declare const getScraperStatus: (options?: RequestInit) => Promise<ScraperStatus>;
export declare const getGetScraperStatusQueryKey: () => readonly ["/api/scraper/status"];
export declare const getGetScraperStatusQueryOptions: <TData = Awaited<ReturnType<typeof getScraperStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getScraperStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getScraperStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetScraperStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getScraperStatus>>>;
export type GetScraperStatusQueryError = ErrorType<unknown>;
/**
 * @summary Get current scraper status
 */
export declare function useGetScraperStatus<TData = Awaited<ReturnType<typeof getScraperStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getScraperStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get dashboard statistics
 */
export declare const getGetDashboardStatsUrl: () => string;
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/stats/dashboard"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get incident counts by country
 */
export declare const getGetCountryStatsUrl: () => string;
export declare const getCountryStats: (options?: RequestInit) => Promise<CountryStatsResponse>;
export declare const getGetCountryStatsQueryKey: () => readonly ["/api/stats/countries"];
export declare const getGetCountryStatsQueryOptions: <TData = Awaited<ReturnType<typeof getCountryStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCountryStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCountryStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCountryStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getCountryStats>>>;
export type GetCountryStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get incident counts by country
 */
export declare function useGetCountryStats<TData = Awaited<ReturnType<typeof getCountryStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCountryStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get trending regions and hotspots
 */
export declare const getGetTrendingRegionsUrl: () => string;
export declare const getTrendingRegions: (options?: RequestInit) => Promise<TrendingRegionsResponse>;
export declare const getGetTrendingRegionsQueryKey: () => readonly ["/api/stats/trending"];
export declare const getGetTrendingRegionsQueryOptions: <TData = Awaited<ReturnType<typeof getTrendingRegions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrendingRegions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTrendingRegions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTrendingRegionsQueryResult = NonNullable<Awaited<ReturnType<typeof getTrendingRegions>>>;
export type GetTrendingRegionsQueryError = ErrorType<unknown>;
/**
 * @summary Get trending regions and hotspots
 */
export declare function useGetTrendingRegions<TData = Awaited<ReturnType<typeof getTrendingRegions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrendingRegions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map