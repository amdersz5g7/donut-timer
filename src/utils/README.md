# Utility Functions

This directory contains reusable utility functions for the Donut Timer application.

## Files

### `debounce.js`
Provides a debounce function to limit how often a function can be called.

**Usage:**
```javascript
import { debounce } from './utils/debounce.js';

const debouncedFunction = debounce(() => {
  console.log('This will only run once every 100ms');
}, 100);

window.addEventListener('scroll', debouncedFunction);
```

---

### `timeUtils.js`
Time formatting and calculation utilities.

**Functions:**

#### `formatTime(date)`
Format a Date object to HH:MM:SS string.

**Usage:**
```javascript
import { formatTime } from './utils/timeUtils.js';

const now = new Date();
console.log(formatTime(now)); // "14:30:45"
```

#### `diffMinutes(dateNow, dateFuture)`
Calculate time difference between two dates.

**Usage:**
```javascript
import { diffMinutes } from './utils/timeUtils.js';

const now = new Date();
const future = new Date(now.getTime() + 5 * 60000); // 5 minutes later
const diff = diffMinutes(now, future);
console.log(diff); // { m: 5, s: 0 }
```

#### `sanitizeHTML(str)`
Sanitize HTML string to prevent XSS attacks.

**Usage:**
```javascript
import { sanitizeHTML } from './utils/timeUtils.js';

const userInput = '<script>alert("XSS")</script>';
const safe = sanitizeHTML(userInput);
console.log(safe); // "&lt;script&gt;alert("XSS")&lt;/script&gt;"
```

#### `scrollToElementWithOffset(element, offset, behavior)`
Scroll to element with offset to account for sticky header.

**Parameters:**
- `element` (HTMLElement) - Element to scroll to
- `offset` (number) - Additional offset in pixels (default: 20)
- `behavior` (string) - Scroll behavior: 'smooth' or 'auto' (default: 'smooth')

**Usage:**
```javascript
import { scrollToElementWithOffset } from './utils/timeUtils.js';
import { SCROLL_OFFSET_PX } from './utils/constants.js';

const cardElement = document.getElementById('card-1');
scrollToElementWithOffset(cardElement, SCROLL_OFFSET_PX);
```

**Why needed:**
When using sticky headers, `element.scrollIntoView()` doesn't account for the fixed header height, causing the element to be hidden behind it. This function calculates the proper scroll position.

---

### `constants.js`
Application-wide constants and configuration values.

**Categories:**
- Timer defaults
- UI thresholds
- Countdown settings
- Voice settings
- Time constants

**Usage:**
```javascript
import { 
  DEFAULT_MAX_MINUTES, 
  ADD_TIMER_COOLDOWN_MS 
} from './utils/constants.js';

let maxMinutes = DEFAULT_MAX_MINUTES; // 75
const cooldown = ADD_TIMER_COOLDOWN_MS; // 500
```

---

## Best Practices

1. **Import only what you need:**
   ```javascript
   import { debounce } from './utils/debounce.js';
   ```

2. **Use constants instead of magic numbers:**
   ```javascript
   // ❌ Bad
   if (now - lastTime < 500) { ... }
   
   // ✅ Good
   import { ADD_TIMER_COOLDOWN_MS } from './utils/constants.js';
   if (now - lastTime < ADD_TIMER_COOLDOWN_MS) { ... }
   ```

3. **Reuse utility functions:**
   ```javascript
   // ❌ Bad - Inline formatting
   const time = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + ...
   
   // ✅ Good - Use utility
   import { formatTime } from './utils/timeUtils.js';
   const time = formatTime(date);
   ```

---

## Future Utilities

Potential utilities to add:

- `storage.js` - LocalStorage wrapper with error handling
- `validation.js` - Input validation functions
- `notifications.js` - Toast notification system
- `keyboard.js` - Keyboard shortcut handler
- `analytics.js` - Analytics tracking helpers

---

**Last Updated:** 2025-12-05
