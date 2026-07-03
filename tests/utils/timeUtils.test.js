import { describe, it, expect } from 'vitest';
import { formatTime, diffMinutes, sanitizeHTML } from '../../src/utils/timeUtils.js';

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
