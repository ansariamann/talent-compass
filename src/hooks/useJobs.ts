import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import type { Job, JobFilters, PaginatedResponse } from '@/types/ats';

// Query keys for cache management
export const jobKeys = {
    all: ['jobs'] as const,
    lists: () => [...jobKeys.all, 'list'] as const,
    list: (filters: JobFilters, page: number, pageSize: number) =>
        [...jobKeys.lists(), { filters, page, pageSize }] as const,
    details: () => [...jobKeys.all, 'detail'] as const,
    detail: (id: string) => [...jobKeys.details(), id] as const,
};

export function useJob(id: string | undefined) {
    return useQuery<Job, Error>({
        queryKey: id ? jobKeys.detail(id) : [...jobKeys.details(), 'missing'],
        queryFn: () => {
            if (!id) throw new Error('Missing job id');
            return jobsApi.get(id);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}

// List jobs with pagination and filters
export function useJobs(
    filters: JobFilters = {},
    page: number = 1,
    pageSize: number = 100
) {
    return useQuery<PaginatedResponse<Job>, Error>({
        queryKey: jobKeys.list(filters, page, pageSize),
        queryFn: () => jobsApi.list(filters, page, pageSize),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// Create job mutation
export function useCreateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Parameters<typeof jobsApi.create>[0]) => jobsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
        },
    });
}

// Update job mutation
export function useUpdateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof jobsApi.update>[1] }) =>
            jobsApi.update(id, data),
        onSuccess: (updatedJob) => {
            queryClient.setQueryData(
                jobKeys.detail(updatedJob.id),
                updatedJob
            );
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
        },
    });
}

// Delete job mutation
export function useDeleteJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => jobsApi.delete(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: jobKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
        },
    });
}
