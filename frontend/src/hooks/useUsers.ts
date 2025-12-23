import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, User } from '@/api/users.api';

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: { search?: string }) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
};

export const useUsers = (search?: string) => {
    return useQuery({
        queryKey: userKeys.list({ search }),
        queryFn: async () => {
            const response = await usersApi.findAll({ search });
            return response.data as User[];
        },
    });
};

export const useUser = (id: string) => {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: async () => {
            const user = await usersApi.findOne(id);
            return user;
        },
        enabled: !!id,
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Parameters<typeof usersApi.create>[0]) =>
            usersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof usersApi.update>[1] }) =>
            usersApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => usersApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
};
