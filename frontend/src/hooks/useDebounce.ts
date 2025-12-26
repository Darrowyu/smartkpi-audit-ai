import { useState, useEffect } from 'react';

/**
 * 防抖 Hook - 延迟更新值直到停止变化
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒），默认 300ms
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * 防抖回调 Hook - 延迟执行回调函数
 * @param callback 需要防抖的回调函数
 * @param delay 延迟时间（毫秒），默认 300ms
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay = 300
): T {
    const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

    const debouncedCallback = ((...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        const id = setTimeout(() => callback(...args), delay);
        setTimeoutId(id);
    }) as T;

    useEffect(() => {
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [timeoutId]);

    return debouncedCallback;
}
