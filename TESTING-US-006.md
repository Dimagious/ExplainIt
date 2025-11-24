# Testing Guide: US-006 - Loading State UI

## User Story
**As a** user  
**I want** to see a clear loading indicator while my explanation is being generated  
**So that** I know the system is working

---

## Prerequisites

1. **Chrome Extension Loaded**
   - Open Chrome: `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder
   - Ensure the extension is enabled

2. **Test Setup**
   - Open the extension popup by clicking the extension icon in the toolbar
   - Open Chrome DevTools (F12) on the popup window (right-click popup → Inspect)

---

## Test Cases

### ✅ TC-006-01: Loading State Appears Immediately

**Acceptance Criteria:**
```gherkin
Scenario: Loading state appears immediately
  Given I click the ExplainIt icon
  When the popup opens
  Then I should see a loading spinner
  And explanatory text "Generating explanation..."
  Within 50ms
```

**Steps:**
1. Open the popup
2. In the console, type: `testLoadingState()`
3. Press Enter

**Expected Result:**
- ✅ Loading spinner appears immediately (blue animated circle)
- ✅ Text "Generating explanation..." is displayed
- ✅ Transition is smooth (no flicker)

---

### ✅ TC-006-02: Loading State Shows Text Preview

**Acceptance Criteria:**
```gherkin
Scenario: Loading state shows selected text preview
  Given the popup is loading
  Then I should see first 100 characters of my selected text
  And it should be in a light gray box
  And truncated with "..." if longer
```

**Steps:**
1. Open the popup
2. In the console, type: `testLoadingState()`
3. Observe the text preview below the spinner

**Expected Result:**
- ✅ Preview shows: "This is a test text to demonstrate the loading state functionality. It should show a preview and th..."
- ✅ Text is in a light gray/blue box
- ✅ Text is truncated at 100 characters with "..."
- ✅ Box has a left border (blue accent)

---

### ✅ TC-006-03: Loading State Transitions to Result

**Acceptance Criteria:**
```gherkin
Scenario: Loading state transitions to result
  Given the popup is in loading state
  When the API returns a successful response
  Then the loading spinner should disappear
  And the result should fade in smoothly
  Within 100ms transition
```

**Steps:**
1. Open the popup
2. In the console, type: `testLoadingState()`
3. Wait for ~2 seconds (simulated API delay)
4. Observe the transition

**Expected Result:**
- ✅ Loading state disappears after ~2 seconds
- ✅ Transition is smooth (fade out)
- ✅ Console logs: "Explanation received: {result: ...}"
- ✅ Empty state appears (US-007 will show actual result)

---

### ✅ TC-006-04: Timeout Warning Appears After 3 Seconds

**Acceptance Criteria:**
```gherkin
Scenario: Loading state handles slow response
  Given the API takes more than 3 seconds
  Then a message "Still working..." should appear
  And the spinner continues to animate
```

**Steps:**
1. Open the popup
2. In the console, modify the test:
   ```javascript
   // Temporarily change the fetchExplanation delay to 5 seconds
   async function testSlowLoading() {
     const testText = 'Testing slow loading...';
     showLoadingState(testText);
     
     // Simulate slow API (5 seconds)
     await new Promise(resolve => setTimeout(resolve, 5000));
     
     hideLoadingState();
     showState('empty');
   }
   testSlowLoading();
   ```
3. Wait and observe

**Expected Result:**
- ✅ Spinner appears immediately
- ✅ After 3 seconds, "Still working..." message appears
- ✅ Message has yellow/orange background
- ✅ Spinner continues animating
- ✅ After 5 seconds, loading state disappears

---

### ✅ TC-006-05: Loading State is Cancellable

**Acceptance Criteria:**
```gherkin
Scenario: Loading state is cancellable
  Given the popup is in loading state
  When I close the popup
  Then the API request should be aborted
  And no error should be shown
```

**Steps:**
1. Open the popup
2. In the console, type: `testLoadingState()`
3. Immediately close the popup (click outside or press Escape)
4. Reopen the popup

**Expected Result:**
- ✅ Console shows: "Popup closing, cleaning up..."
- ✅ Console shows: "Pending request aborted"
- ✅ No errors in console
- ✅ When popup reopens, it shows empty state (not loading)

---

### ✅ TC-006-06: Loading State Cleans Up Properly

**Steps:**
1. Open the popup
2. In the console, type: `testLoadingState()`
3. While loading, manually switch states:
   ```javascript
   showState('empty');
   ```

**Expected Result:**
- ✅ Timeout warning timer is cleared
- ✅ Text preview is cleared
- ✅ Pending request is aborted
- ✅ Console shows: "Hiding loading state"
- ✅ Console shows: "Pending request aborted"

---

### ✅ TC-006-07: Spinner Animation Quality

**Steps:**
1. Open the popup
2. In the console, type: `testLoadingState()`
3. Observe the spinner closely

**Expected Result:**
- ✅ Spinner rotates smoothly (no jitter)
- ✅ Spinner is 48px × 48px (larger than before)
- ✅ Spinner has blue top border (#4A90E2)
- ✅ Rotation speed: ~0.8s per revolution
- ✅ Loading text pulses gently (opacity 1 ↔ 0.6)

---

### ✅ TC-006-08: Text Preview Edge Cases

**Test 1: Short Text (<100 chars)**
```javascript
showLoadingState('Short text');
```
**Expected:** Text displayed without "..." truncation

**Test 2: Exactly 100 chars**
```javascript
showLoadingState('A'.repeat(100));
```
**Expected:** All 100 chars displayed, no truncation

**Test 3: Long Text (>100 chars)**
```javascript
showLoadingState('A'.repeat(150));
```
**Expected:** First 100 chars + "..."

**Test 4: Empty Text**
```javascript
showLoadingState('');
```
**Expected:** Preview box is hidden (CSS: `display: none` when empty)

**Test 5: Multiline Text**
```javascript
showLoadingState('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
```
**Expected:** Text wraps properly, preserves line breaks

---

## Performance Checks

### ⚡ P-006-01: Popup Load Time
**Target:** ≤300ms (from US-005)

**Steps:**
1. Open popup
2. Check DevTools Performance tab
3. Or check console timestamp

**Expected:** Popup fully interactive within 300ms

---

### ⚡ P-006-02: State Transition Speed
**Target:** ≤100ms

**Steps:**
1. Call `testLoadingState()`
2. Measure time from showState() to visual change

**Expected:** Smooth fade-in animation completes within 100ms

---

## Visual Design Checklist

- ✅ Spinner is centered horizontally and vertically
- ✅ "Generating explanation..." text is large (16px) and medium weight
- ✅ Text preview has proper spacing and padding
- ✅ Timeout warning stands out (yellow background)
- ✅ Overall loading screen height: ~250px minimum
- ✅ Loading state feels responsive and alive (animations)

---

## Console Commands for Testing

```javascript
// Basic test
testLoadingState();

// Manual control
showLoadingState('Your test text here...');
hideLoadingState();

// Show/hide timeout warning
document.getElementById('timeout-warning').classList.remove('hidden');
document.getElementById('timeout-warning').classList.add('hidden');

// Abort a pending request
if (abortController) abortController.abort();

// Check current state
console.log('Current state:', currentState);
```

---

## Known Issues / TODOs

- ⏳ **US-007**: Result state not yet implemented (shows empty state after loading)
- ⏳ **US-022**: Real text selection → popup flow not implemented
- ⏳ **US-019**: Actual backend API integration pending

---

## Acceptance Criteria Summary

All criteria from US-006 must pass:

| Criteria | Status | Notes |
|----------|--------|-------|
| Loading state appears <50ms | ✅ | Instant transition |
| Spinner animates smoothly | ✅ | 0.8s rotation |
| Text "Generating explanation..." | ✅ | Large, pulsing |
| Text preview (first 100 chars) | ✅ | Truncated with "..." |
| Preview in gray box | ✅ | Light blue/gray bg |
| Timeout warning after 3s | ✅ | Yellow "Still working..." |
| Transition to result <100ms | ✅ | Smooth fade |
| Request is cancellable | ✅ | AbortController works |
| Cleanup on popup close | ✅ | Unload handler |

---

## Regression Tests

Ensure US-005 still works:
- ✅ Popup structure intact
- ✅ Settings screen accessible
- ✅ Screen switching works
- ✅ Empty state displays correctly

---

## Sign-off

**Tested by:** _________________  
**Date:** _________________  
**Result:** ☐ PASS  ☐ FAIL  
**Notes:**

---

*This testing guide covers US-006: Loading State UI*  
*Next: US-007 - Display Explanation Result*

