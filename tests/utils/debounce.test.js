import { describe, it, expect, vi } from 'vitest';
import { debounce } from '../../src/utils/debounce.js';

describe('debounce', () => {
    it('only calls function after wait period', async () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced();
        debounced();

        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(99);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    it('passes arguments to debounced function', async () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 50);

        debounced('a', 'b');
        vi.advanceTimersByTime(50);

        expect(fn).toHaveBeenCalledWith('a', 'b');
        vi.useRealTimers();
    });

    it('resets timer on subsequent calls', async () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        vi.advanceTimersByTime(50);
        debounced(); // resets
        vi.advanceTimersByTime(50);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });
});
