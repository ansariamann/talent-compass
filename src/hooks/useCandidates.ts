import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '@/lib/api';
import type { Candidate, CandidateFilters, PaginatedResponse } from '@/types/ats';

// Query keys for cache management
export const candidateKeys = {
    all: ['candidates'] as const,
    lists: () => [...candidateKeys.all, 'list'] as const,
    list: (filters: CandidateFilters, page: number, pageSize: number) =>
        [...candidateKeys.lists(), { filters, page, pageSize }] as const,
    details: () => [...candidateKeys.all, 'detail'] as const,
    detail: (id: string) => [...candidateKeys.details(), id] as const,
    statistics: () => [...candidateKeys.all, 'statistics'] as const,
    duplicates: (id: string) => [...candidateKeys.all, 'duplicates', id] as const,
    byEmail: (email: string) => [...candidateKeys.all, 'email', email] as const,
};

// List candidates with pagination and filters
export function useCandidates(
    filters: CandidateFilters = {},
    page: number = 1,
    pageSize: number = 25
) {
    return useQuery<PaginatedResponse<Candidate>, Error>({
        queryKey: candidateKeys.list(filters, page, pageSize),
        queryFn: () => candidatesApi.list(filters, page, pageSize),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// Get single candidate by ID
export function useCandidate(id: string | undefined) {
    return useQuery<Candidate, Error>({
        queryKey: candidateKeys.detail(id!),
        queryFn: () => candidatesApi.get(id!),
        enabled: !!id,
    });
}

// Search candidates
export function useCandidateSearch(query: string) {
    return useQuery<Candidate[], Error>({
        queryKey: ['candidates', 'search', query],
        queryFn: () => candidatesApi.search(query),
        enabled: query.length >= 2,
        staleTime: 1000 * 30, // 30 seconds
    });
}

// Get candidate by email
export function useCandidateByEmail(email: string) {
    return useQuery<Candidate, Error>({
        queryKey: candidateKeys.byEmail(email),
        queryFn: () => candidatesApi.getByEmail(email),
        enabled: email.length > 0 && email.includes('@'),
        staleTime: 1000 * 60 * 5,
        retry: false,
    });
}

// Find duplicate candidates
export function useCandidateDuplicates(id: string | undefined) {
    return useQuery<Candidate[], Error>({
        queryKey: candidateKeys.duplicates(id!),
        queryFn: () => candidatesApi.findDuplicates(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}

// Get candidate statistics
export function useCandidateStatistics() {
    return useQuery({
        queryKey: candidateKeys.statistics(),
        queryFn: () => candidatesApi.getStatistics(),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

// Update candidate mutation
export function useUpdateCandidate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Candidate> }) =>
            candidatesApi.update(id, data),
        onSuccess: (updatedCandidate) => {
            // Update the specific candidate in cache
            queryClient.setQueryData(
                candidateKeys.detail(updatedCandidate.id),
                updatedCandidate
            );
            // Invalidate list queries to refetch
            queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
        },
    });
}

// Create candidate mutation
export function useCreateCandidate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Candidate>) => candidatesApi.create(data),
        onSuccess: () => {
            // Invalidate list queries to refetch with new candidate
            queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: candidateKeys.statistics() });
        },
    });
}

// Delete candidate mutation
export function useDeleteCandidate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => candidatesApi.delete(id),
        onSuccess: (_, id) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: candidateKeys.detail(id) });
            // Invalidate list queries to refetch
            queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: candidateKeys.statistics() });
        },
    });
}
