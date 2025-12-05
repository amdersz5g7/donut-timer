/**
 * Format a Date object to HH:MM:SS string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted time string (HH:MM:SS)
 */
export function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}
/**
 * Calculate time difference between two dates
 * @param {Date} dateNow - Current date
 * @param {Date} dateFuture - Target date
 * @returns {{m: number, s: number}} Minutes and seconds remaining
 */
export function diffMinutes(dateNow, dateFuture) {
    if (dateNow > dateFuture) {
        return { m: 0, s: 0 };
    }
    let delta = Math.abs(dateFuture - dateNow) / 1000;
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;
    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    const seconds = Math.floor(delta % 60);
    const totalMinutes = Math.floor((dateFuture - dateNow) / 60000);
    return { m: totalMinutes, s: seconds };
}
/**
 * Sanitize HTML string to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
/**
 * Scroll to element with offset to account for sticky header
 * @param {HTMLElement} element - Element to scroll to
 * @param {number} offset - Additional offset in pixels (default: 20)
 * @param {string} behavior - Scroll behavior: 'smooth' or 'auto' (default: 'smooth')
 */
export function scrollToElementWithOffset(element, offset = 20, behavior = 'smooth') {
    if (!element) return;

    // Get sticky header height
    const headerElement = document.getElementById('summary');
    const headerHeight = headerElement ? headerElement.offsetHeight : 0;

    // Calculate position
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;

    // Scroll to position
    window.scrollTo({
        top: offsetPosition,
        behavior: behavior
    });
}