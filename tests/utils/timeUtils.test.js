import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime, diffMinutes, sanitizeHTML, scrollToElementWithOffset } from '../../src/utils/timeUtils.js';

describe('formatTime', () => {
    it('formats date to HH:MM:SS', () => {
        const date = new Date(2024, 0, 1, 14, 5, 9);
        expect(formatTime(date)).toBe('14:05:09');
    });

    it('pads single digits', () => {
        const date = new Date(2024, 0, 1, 8, 3, 2);
        expect(formatTime(date)).toBe('08:03:02');
    });

    it('handles midnight', () => {
        const date = new Date(2024, 0, 1, 0, 0, 0);
        expect(formatTime(date)).toBe('00:00:00');
    });
});

describe('diffMinutes', () => {
    it('returns 0 if now is past future', () => {
        const now = new Date('2024-01-01T14:00:00');
        const future = new Date('2024-01-01T13:00:00');
        expect(diffMinutes(now, future)).toEqual({ m: 0, s: 0 });
    });

    it('calculates minutes and seconds correctly', () => {
        const now = new Date('2024-01-01T14:00:00');
        const future = new Date('2024-01-01T15:30:45');
        const result = diffMinutes(now, future);
        expect(result.m).toBe(90);
        expect(result.s).toBe(45);
    });

    it('handles same time', () => {
        const now = new Date('2024-01-01T14:00:00');
        const future = new Date('2024-01-01T14:00:00');
        expect(diffMinutes(now, future)).toEqual({ m: 0, s: 0 });
    });
});

describe('sanitizeHTML', () => {
    it('escapes HTML tags', () => {
        const result = sanitizeHTML('<script>alert("xss")</script>');
        expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    it('preserves safe text', () => {
        expect(sanitizeHTML('Hello World')).toBe('Hello World');
    });

    it('handles ampersands', () => {
        const result = sanitizeHTML('A & B');
        expect(result).toBe('A &amp; B');
    });
});

describe('scrollToElementWithOffset', () => {
    let scrollToMock;
    let getElementByIdMock;

    beforeEach(() => {
        scrollToMock = vi.fn();
        window.scrollTo = scrollToMock;
        window.pageYOffset = 100;
        getElementByIdMock = vi.fn();
        document.getElementById = getElementByIdMock;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns early if no element provided', () => {
        scrollToElementWithOffset(null);
        expect(scrollToMock).not.toHaveBeenCalled();
    });

    it('scrolls with default offset when no header', () => {
        getElementByIdMock.mockReturnValue(null);
        const el = {
            getBoundingClientRect: () => ({ top: 200 }),
        };
        scrollToElementWithOffset(el);
        expect(scrollToMock).toHaveBeenCalledWith({
            top: 280, // 200 + 100 - 0 - 20
            behavior: 'smooth',
        });
    });

    it('accounts for header height in offset calculation', () => {
        getElementByIdMock.mockReturnValue({ offsetHeight: 50 });
        const el = {
            getBoundingClientRect: () => ({ top: 300 }),
        };
        scrollToElementWithOffset(el, 30, 'auto');
        expect(scrollToMock).toHaveBeenCalledWith({
            top: 320, // 300 + 100 - 50 - 30
            behavior: 'auto',
        });
    });
});
