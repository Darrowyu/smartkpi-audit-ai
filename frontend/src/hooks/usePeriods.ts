import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';

export const periodKeys = {
    all: ['periods'] as const,
    lists: () => [...periodKeys.all, 'list'] as const,
    list: (filters: { status?: PeriodStatus }) => [...periodKeys.lists(), filters] as const,
    details: () => [...periodKeys.all, 'detail'] as const,
    detail: (id: string) => [...periodKeys.details(), id] as const,
};

export const usePeriods = (status?: PeriodStatus) => {
    return useQuery({
        queryKey: periodKeys.list({ status }),
        queryFn: async () => {
            const response = await assessmentApi.getPeriods();
            let periods = response.data || [];
            if (status) {
                periods = periods.filter((p: AssessmentPeriod) => p.status === status);
            }
            return periods as AssessmentPeriod[];
        },
    });
};

export const useActivePeriods = () => {
    return useQuery({
        queryKey: periodKeys.list({ status: PeriodStatus.ACTIVE }),
        queryFn: async () => {
            const response = await assessmentApi.getPeriods();
            const allPeriods = response.data || [];
            return allPeriods.filter(
                (p: AssessmentPeriod) => p.status === PeriodStatus.ACTIVE || p.status === PeriodStatus.DRAFT
            ) as AssessmentPeriod[];
        },
    });
};

export const useCreatePeriod = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; startDate: string; endDate: string }) =>
            assessmentApi.createPeriod(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: periodKeys.all });
        },
    });
};

export const useLockPeriod = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => assessmentApi.lockPeriod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: periodKeys.all });
        },
    });
};
