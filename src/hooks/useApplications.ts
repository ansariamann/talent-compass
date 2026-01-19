import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/lib/api';
import type { Application, ApplicationFilters, PaginatedResponse } from '@/types/ats';

// Query keys for cache management
export const applicationKeys = {
    all: ['applications'] as const,
    lists: () => [...applicationKeys.all, 'list'] as const,
    list: (filters: ApplicationFilters, page: number, pageSize: number) =>
        [...applicationKeys.lists(), { filters, page, pageSize }] as const,
    details: () => [...applicationKeys.all, 'detail'] as const,
    detail: (id: string) => [...applicationKeys.details(), id] as const,
    byCandidate: (candidateId: string) => [...applicationKeys.all, 'candidate', candidateId] as const,
    statistics: () => [...applicationKeys.all, 'statistics'] as const,
};

// List applications with pagination and filters
export function useApplications(
    filters: ApplicationFilters = {},
    page: number = 1,
    pageSize: number = 25
) {
    return useQuery<PaginatedResponse<Application>, Error>({
        queryKey: applicationKeys.list(filters, page, pageSize),
        queryFn: () => applicationsApi.list(filters, page, pageSize),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// Get single application by ID
export function useApplication(id: string | undefined) {
    return useQuery<Application, Error>({
        queryKey: applicationKeys.detail(id!),
        queryFn: () => applicationsApi.get(id!),
        enabled: !!id,
    });
}

// Get applications by candidate
export function useApplicationsByCandidate(candidateId: string | undefined) {
    return useQuery<Application[], Error>({
        queryKey: applicationKeys.byCandidate(candidateId!),
        queryFn: () => applicationsApi.getByCandidate(candidateId!),
        enabled: !!candidateId,
    });
}

// Get application statistics
export function useApplicationStatistics() {
    return useQuery({
        queryKey: applicationKeys.statistics(),
        queryFn: () => applicationsApi.getStatistics(),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

// Update application status mutation
export function useUpdateApplicationStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
            applicationsApi.updateStatus(id, status, note),
        onSuccess: (updatedApplication) => {
            // Update the specific application in cache
            queryClient.setQueryData(
                applicationKeys.detail(updatedApplication.id),
                updatedApplication
            );
            // Invalidate list queries to refetch
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: applicationKeys.statistics() });
        },
    });
}

// Add note mutation
export function useAddApplicationNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, content, isInternal }: { id: string; content: string; isInternal?: boolean }) =>
            applicationsApi.addNote(id, content, isInternal),
        onSuccess: (_, { id }) => {
            // Invalidate the specific application to refetch with new note
            queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
        },
    });
}
