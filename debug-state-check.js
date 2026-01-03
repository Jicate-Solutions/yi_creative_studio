// Quick State Checker - Run this in browser console
// Check if Zustand state is persisting correctly

console.group('🔍 Create Page State Debug');

// Check localStorage for persisted state
const creativeState = localStorage.getItem('creative-storage');
if (creativeState) {
  const parsed = JSON.parse(creativeState);
  console.log('📦 Persisted State:', {
    hasSelectedVertical: !!parsed.state?.selectedVertical,
    selectedVerticalId: parsed.state?.selectedVertical?.id,
    selectedVerticalName: parsed.state?.selectedVertical?.name,
    verticalsCount: parsed.state?.verticals?.length || 0,
  });
} else {
  console.warn('⚠️  No persisted creative state found');
}

// Check if verticals are loaded
const verticalsCheck = window.localStorage.getItem('vertical-presets-cache');
console.log('🎯 Verticals Cache:', verticalsCheck ? 'EXISTS' : 'MISSING');

// Check current page state (if React DevTools is available)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React DevTools available - inspect components');
} else {
  console.warn('⚠️  React DevTools not available');
}

console.groupEnd();

console.log(`
📋 CHECKLIST:
[ ] Are verticals loaded? (Should see vertical cards in UI)
[ ] Is a vertical selected? (Card should be highlighted)
[ ] Is a model selected? (Dropdown should show model name)
[ ] Is generate button enabled? (Should be blue, not gray)

If verticals aren't showing or selections aren't persisting:
1. Clear browser cache: Ctrl+Shift+Delete
2. Reload page: Ctrl+F5
3. Check browser console for errors: F12
`);
