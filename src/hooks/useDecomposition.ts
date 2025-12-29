import { useMutation } from '@tanstack/react-query';
import { decomposePdf, ApiError } from '@/services/api';
import type { DecompositionResponse } from '@/types';

interface UseDecompositionOptions {
    onSuccess?: (data: DecompositionResponse) => void;
    onError?: (error: ApiError) => void;
}

export function useDecomposition(options?: UseDecompositionOptions) {
    return useMutation({
        mutationFn: ({ file }: { file: File }) => decomposePdf(file),
        onSuccess: options?.onSuccess,
        onError: options?.onError,
    });
}
