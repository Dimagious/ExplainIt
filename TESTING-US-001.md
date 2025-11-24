# Testing US-001: Text Selection Detection

## ✅ Implementation Complete

**User Story**: US-001 - Detect Text Selection  
**Branch**: `feature/us-001-text-selection`  
**Tasks Completed**: TASK-001, TASK-002, TASK-003, TASK-004  
**Estimated**: 11 hours  
**Status**: ✅ Ready for Testing

---

## 🧪 How to Test

### Prerequisites
1. Chrome browser (latest version)
2. Extension loaded in developer mode

### Step 1: Load Extension

```bash
# Make sure you're on the correct branch
git checkout feature/us-001-text-selection

# Open Chrome
# Navigate to: chrome://extensions/
# Enable "Developer mode" (top right)
# Click "Load unpacked"
# Select: /path/to/ExplainIt/extension/
```

### Step 2: Open Test Page

```bash
# Option 1: Open test-page.html directly
open test-page.html

# Option 2: Use file:// protocol
# In Chrome, press Cmd+O and select test-page.html
```

### Step 3: Open DevTools

Press `F12` or `Cmd+Option+I` to open Chrome DevTools.  
Go to **Console** tab.

---

## 📋 Test Scenarios

### ✅ Scenario 1: Valid Selection (≥3 chars)

**Given**: I am on test-page.html  
**When**: I select text "Select this text to test" (≥3 chars)  
**Then**:
- Console shows: `[ExplainIt] Text selected: Select this text to test...`
- Selected text is stored in memory

**How to test**:
1. Select any text from Test Section 1
2. Check console for success message
3. Try different text lengths (3, 10, 50, 100 chars)

---

### ✅ Scenario 2: Short Selection (<3 chars)

**Given**: I am on test-page.html  
**When**: I select only 1-2 characters (e.g., "a" or "ab")  
**Then**:
- Console shows: `[ExplainIt] Selection too short: X chars`
- Console shows: `[ExplainIt] Selection cleared or invalid`
- No icon appears (US-002 - not yet implemented)

**How to test**:
1. Select single character "a" from Test Section 2
2. Check console for "too short" message
3. Try selecting "ab" (2 chars) - should also be rejected

---

### ✅ Scenario 3: Long Selection (>2000 chars)

**Given**: I am on test-page.html  
**When**: I select all text from Test Section 3 (>2000 chars)  
**Then**:
- Console shows: `[ExplainIt] Selection truncated from XXXX to 2000 chars`
- Console shows: `[ExplainIt] Text selected: [first 50 chars]...`
- Only first 2000 characters are stored

**How to test**:
1. Select ALL text in the blue box (Test Section 3)
2. Check console for truncation message
3. Verify character counts in log

---

### ✅ Scenario 4: Deselect Text

**Given**: I have selected valid text  
**When**: I click elsewhere on the page  
**Then**:
- Selection is cleared
- Console shows: `[ExplainIt] Selection cleared or invalid`

**How to test**:
1. Select text from any section
2. Click on empty space (e.g., between sections)
3. Check console for "cleared" message

---

### ✅ Scenario 5: IFrame Selection

**Given**: Page contains an iframe (Test Section 4)  
**When**: I select text inside the iframe  
**Then**:
- Console shows: `[ExplainIt] Running in iframe`
- Selection detection works same as main page
- Console shows: `[ExplainIt] Text selected: ...`

**How to test**:
1. Scroll to Test Section 4 (iframe with blue border)
2. Click inside the iframe
3. Select text: "Try selecting this text inside the iframe"
4. Check console for both iframe detection AND text selection logs

---

## 🔍 Additional Tests

### Test 6: Multiple Rapid Selections

**Purpose**: Test debouncing  
**Steps**:
1. Rapidly select different text multiple times
2. Verify only final selection is logged (after 300ms delay)
3. No excessive console spam

### Test 7: Selection with Whitespace

**Purpose**: Test trimming  
**Steps**:
1. Select text with leading/trailing spaces: "   text   "
2. Verify console shows trimmed version: "text"

### Test 8: Different Websites

**Purpose**: Test on real websites  
**Steps**:
1. Navigate to wikipedia.org, medium.com, github.com
2. Select text on each site
3. Verify console logs appear
4. Check for conflicts with site's own scripts

---

## ✅ Acceptance Criteria Checklist

Check all that apply after testing:

- [ ] **AC1**: Extension detects selection of ≥3 characters
- [ ] **AC2**: Extension ignores selection of <3 characters
- [ ] **AC3**: Extension truncates selection >2000 characters
- [ ] **AC4**: Selection clears when clicking elsewhere
- [ ] **AC5**: Works in iframes (same-origin)
- [ ] **AC6**: Event listeners registered successfully
- [ ] **AC7**: Selected text captured accurately
- [ ] **AC8**: Edge cases handled (empty, whitespace)
- [ ] **AC9**: Debouncing prevents excessive processing
- [ ] **AC10**: Console logs are clear and informative

---

## 🐛 Known Issues / Limitations

### Current Limitations (Expected):
1. **No visual icon yet** - US-002 not implemented
2. **No communication with popup** - US-022 not implemented
3. **Cross-origin iframes** - May not work due to browser security
4. **No persistence** - Selected text not stored between page reloads

### Report Bugs:
If you find unexpected behavior, note:
- Browser version
- Website URL
- Selected text (first 50 chars)
- Console error messages
- Steps to reproduce

---

## 📊 Performance Metrics

Expected performance:
- **Event listener registration**: <10ms
- **Selection detection**: <50ms
- **Debounce delay**: 300ms
- **Validation**: <1ms

To measure:
```javascript
// In DevTools Console
console.time('selection');
// Select text
console.timeEnd('selection');
```

---

## 🔄 Next Steps

After US-001 is verified:
1. Merge `feature/us-001-text-selection` → `main`
2. Create new branch `feature/us-002-floating-icon`
3. Implement TASK-005 to TASK-009 (Icon display)

---

## 📝 Testing Notes

Record your testing results:

**Tested by**: ___________  
**Date**: ___________  
**Browser**: Chrome ___________  

**Test Results**:
- [ ] All scenarios passed
- [ ] Some scenarios failed (list below)
- [ ] Ready for code review
- [ ] Needs fixes

**Issues Found**:
1. ___________
2. ___________
3. ___________

**Comments**:
___________
___________
___________

---

**Status**: 🟢 Ready for Testing  
**Next US**: US-002 (Floating Icon Display)

