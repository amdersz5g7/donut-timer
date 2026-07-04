# Auto-Scroll Fix - Sticky Header Offset

## 🐛 **Problem Analysis**

### **Issue:**
When a timer finishes, it auto-scrolls to the timer card using `scrollIntoView()`. However, the timer card gets hidden behind the sticky summary header.

### **Root Cause:**
```javascript
// BEFORE: Simple scrollIntoView
cardElement.scrollIntoView();
```

**Why it fails:**
- `scrollIntoView()` scrolls the element to the top of the viewport
- Sticky header is `position: fixed` at the top
- Element scrolls UNDER the sticky header
- User can't see the timer that just finished

### **Visual Problem:**
```
┌─────────────────────────────┐
│ STICKY HEADER (fixed)       │ ← Covers the content
├─────────────────────────────┤
│ [Timer Card - HIDDEN]       │ ← scrollIntoView() puts it here
│                             │
│ Other content...            │
└─────────────────────────────┘
```

---

## ✅ **Solution**

### **Approach:**
Calculate scroll position manually with offset for sticky header height.

### **Implementation:**

#### **1. Created Utility Function**
```javascript
// src/utils/timeUtils.js

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
```

#### **2. Added Constant**
```javascript
// src/utils/constants.js
export const SCROLL_OFFSET_PX = 20; // Extra margin when scrolling to element
```

#### **3. Updated Countdown Function**
```javascript
// BEFORE
cardElement.scrollIntoView();

// AFTER
import { scrollToElementWithOffset } from './utils/timeUtils.js';
import { SCROLL_OFFSET_PX } from './utils/constants.js';

scrollToElementWithOffset(cardElement, SCROLL_OFFSET_PX);
```

---

## 🎯 **How It Works**

### **Step-by-Step:**

1. **Get Element Position**
   ```javascript
   const elementPosition = element.getBoundingClientRect().top;
   ```
   - Returns position relative to viewport

2. **Get Sticky Header Height**
   ```javascript
   const headerElement = document.getElementById('summary');
   const headerHeight = headerElement ? headerElement.offsetHeight : 0;
   ```
   - Dynamically gets current header height
   - Handles case where header doesn't exist

3. **Calculate Scroll Position**
   ```javascript
   const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;
   ```
   - `elementPosition` = position in viewport
   - `window.pageYOffset` = current scroll position
   - `- headerHeight` = subtract header height
   - `- offset` = extra margin (20px)

4. **Smooth Scroll**
   ```javascript
   window.scrollTo({
     top: offsetPosition,
     behavior: 'smooth'
   });
   ```

### **Visual Result:**
```
┌─────────────────────────────┐
│ STICKY HEADER (fixed)       │
├─────────────────────────────┤
│ [20px margin]               │ ← SCROLL_OFFSET_PX
│ [Timer Card - VISIBLE! ✓]  │ ← Properly positioned
│                             │
│ Other content...            │
└─────────────────────────────┘
```

---

## 📊 **Comparison**

| Aspect | Before | After |
|--------|--------|-------|
| **Method** | `scrollIntoView()` | `scrollToElementWithOffset()` |
| **Header aware** | ❌ No | ✅ Yes |
| **Smooth scroll** | ❌ No | ✅ Yes |
| **Extra margin** | ❌ No | ✅ 20px |
| **Reusable** | ❌ No | ✅ Yes |
| **Configurable** | ❌ No | ✅ Yes (offset, behavior) |

---

## 🧪 **Testing**

### **Test Scenarios:**

1. **Timer finishes on visible area**
   - ✅ Scrolls to proper position
   - ✅ Not hidden by header

2. **Timer finishes below viewport**
   - ✅ Scrolls up smoothly
   - ✅ Visible with margin

3. **Timer finishes above viewport**
   - ✅ Scrolls down smoothly
   - ✅ Visible with margin

4. **Sticky header not present**
   - ✅ Falls back to 0 height
   - ✅ Still works correctly

5. **Multiple timers finish**
   - ✅ Each scrolls correctly
   - ✅ Smooth transitions

---

## 🎨 **Benefits**

### **1. Better UX**
- User immediately sees the finished timer
- No need to manually scroll
- Smooth animation draws attention

### **2. Reusable**
- Can be used anywhere in the app
- Configurable offset and behavior
- Handles edge cases

### **3. Maintainable**
- Centralized in utility file
- Well documented
- Easy to modify

### **4. Robust**
- Handles missing elements
- Dynamic header height
- Works with/without sticky header

---

## 📝 **Usage Examples**

### **Basic Usage:**
```javascript
import { scrollToElementWithOffset } from './utils/timeUtils.js';

const element = document.getElementById('my-element');
scrollToElementWithOffset(element);
```

### **Custom Offset:**
```javascript
scrollToElementWithOffset(element, 50); // 50px margin
```

### **Instant Scroll (No Animation):**
```javascript
scrollToElementWithOffset(element, 20, 'auto');
```

### **With Constant:**
```javascript
import { SCROLL_OFFSET_PX } from './utils/constants.js';
scrollToElementWithOffset(element, SCROLL_OFFSET_PX);
```

---

## 🔧 **Configuration**

### **Adjust Offset:**
Edit `src/utils/constants.js`:
```javascript
export const SCROLL_OFFSET_PX = 30; // Increase margin
```

### **Change Behavior:**
```javascript
// In countdown function
scrollToElementWithOffset(cardElement, SCROLL_OFFSET_PX, 'auto'); // Instant
```

---

## 🚀 **Future Enhancements**

Potential improvements:

1. **Highlight Effect**
   - Add flash/pulse animation after scroll
   - Draw more attention to finished timer

2. **Sound Alert**
   - Play sound before scroll
   - Better notification

3. **Scroll Queue**
   - If multiple timers finish simultaneously
   - Queue scrolls with delay

4. **User Preference**
   - Allow disabling auto-scroll
   - Configurable offset in settings

---

## 📚 **Related Files**

- `src/App.svelte` - Countdown function
- `src/utils/timeUtils.js` - Utility function
- `src/utils/constants.js` - Configuration
- `src/utils/README.md` - Documentation

---

## ✅ **Summary**

**Problem:** Auto-scroll hidden by sticky header  
**Solution:** Custom scroll with offset calculation  
**Result:** Timer cards properly visible when finished  

**Files Modified:** 3  
**Files Created:** 0  
**Lines Added:** ~30  
**Breaking Changes:** None  

---

**Last Updated:** 2026-07-04  
**Version:** v26.07
