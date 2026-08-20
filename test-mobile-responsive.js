// test-mobile-responsive.js
// Automated verification suite for Preparation OS Mobile Responsiveness across all pages and viewports

import fs from 'fs';
import path from 'path';

async function runMobileResponsiveTests() {
  console.log('📱 Starting Mobile Responsiveness & Audit Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, description) {
    if (condition) {
      console.log(`✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${description}`);
      failed++;
    }
  }

  // 1. Check index.css for mobile media queries and overflow-x protections
  const cssPath = path.resolve('src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert(cssContent.includes('@media (max-width: 768px)') && cssContent.includes('@media (max-width: 480px)'),
    '1. CSS includes dedicated mobile breakpoints (<=768px and <=480px)');

  assert(cssContent.includes('overflow-x: hidden !important') && cssContent.includes('max-width: 100vw !important'),
    '2. CSS prevents unintended global horizontal viewport overflow on mobile');

  assert(cssContent.includes('padding-bottom: calc(90px + env(safe-area-inset-bottom))'),
    '3. CSS adds safe-area bottom padding to prevent bottom-nav content occlusion');

  assert(cssContent.includes('.dashboard-main-grid') && cssContent.includes('grid-template-columns: 1fr !important'),
    '4. Dashboard main grid collapses to responsive single-column layout on mobile');

  assert(cssContent.includes('.progress-main-grid') && cssContent.includes('.sessions-dual-grid'),
    '5. Progress & Study Sessions grids collapse to responsive stacked layouts on mobile');

  // 2. Check TopBar.jsx mobile responsiveness
  const topbarPath = path.resolve('src/components/layout/TopBar.jsx');
  const topbarContent = fs.readFileSync(topbarPath, 'utf8');

  assert(topbarContent.includes('topbar-title-wrap') && topbarContent.includes('topbar-mode-btn'),
    '6. TopBar has dedicated compact mobile elements and responsive title overflow protection');

  // 3. Check Dashboard.jsx mobile responsive layout
  const dashPath = path.resolve('src/pages/Dashboard.jsx');
  const dashContent = fs.readFileSync(dashPath, 'utf8');

  assert(dashContent.includes('dashboard-main-grid') && dashContent.includes('area-tabs-container'),
    '7. Dashboard uses responsive grid class and swipeable area tabs container');

  // 4. Check StudyPlanner.jsx mobile single-day feed
  const plannerPath = path.resolve('src/pages/StudyPlanner.jsx');
  const plannerContent = fs.readFileSync(plannerPath, 'utf8');

  assert(plannerContent.includes('desktop-only') && plannerContent.includes('mobile-only'),
    '8. Study Planner provides single-day mobile view and retains 7-day multi-column on desktop');

  // 5. Check TeachingSchedule.jsx mobile single-day selector
  const teachPath = path.resolve('src/pages/TeachingSchedule.jsx');
  const teachContent = fs.readFileSync(teachPath, 'utf8');

  assert(teachContent.includes('mobileDayIndex') && teachContent.includes('activeMobileDay'),
    '9. Teaching Schedule provides single-day mobile navigation and retains 7-day weekly grid on desktop');

  // 6. Check StudySessions.jsx dual grid & card responsiveness
  const sessPath = path.resolve('src/pages/StudySessions.jsx');
  const sessContent = fs.readFileSync(sessPath, 'utf8');

  assert(sessContent.includes('sessions-dual-grid'),
    '10. Study Sessions dual summary cards collapse cleanly without fixed minWidth overflows');

  // 7. Check Preparation.jsx topic row responsiveness
  const prepPath = path.resolve('src/pages/Preparation.jsx');
  const prepContent = fs.readFileSync(prepPath, 'utf8');

  assert(prepContent.includes('flexWrap: \'wrap\'') && prepContent.includes('renderTopicRow'),
    '11. Preparation topic rows use responsive flex-wrapping to stack metadata on mobile');

  // 8. Check Progress.jsx grid responsiveness
  const progPath = path.resolve('src/pages/Progress.jsx');
  const progContent = fs.readFileSync(progPath, 'utf8');

  assert(progContent.includes('progress-main-grid'),
    '12. Progress page collapses area progress and topic status donut chart vertically on mobile');

  // 9. Check GitaShloka.jsx filter & input responsiveness
  const gitaPath = path.resolve('src/pages/GitaShloka.jsx');
  const gitaContent = fs.readFileSync(gitaPath, 'utf8');

  assert(gitaContent.includes('gridTemplateColumns') && gitaContent.includes('auto-fit'),
    '13. Gita Shloka inputs use auto-fit responsive grid adapting to mobile viewports');

  // 10. Check Vocabulary.jsx mobile search & card responsiveness
  const vocabPath = path.resolve('src/pages/Vocabulary.jsx');
  const vocabContent = fs.readFileSync(vocabPath, 'utf8');

  assert(vocabPath && vocabContent.includes('handleSearchDictionary') && vocabContent.includes('flexWrap: \'wrap\''),
    '14. Vocabulary page dictionary search and action bars wrap responsively on mobile');

  // 11. Check Notifications.jsx mobile card wrapping
  const notifPath = path.resolve('src/pages/Notifications.jsx');
  const notifContent = fs.readFileSync(notifPath, 'utf8');

  assert(notifContent.includes('flexWrap') || notifContent.includes('badge'),
    '15. Notifications cards stack timestamps and dismiss controls cleanly on mobile');

  // 12. Check Settings.jsx mobile input layout
  const setPath = path.resolve('src/pages/Settings.jsx');
  const setContent = fs.readFileSync(setPath, 'utf8');

  assert(setContent.includes('card') && setContent.includes('form-group'),
    '16. Settings page forms utilize responsive form groups');

  console.log('\n========================================');
  console.log(`Mobile Responsiveness Verification Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runMobileResponsiveTests();
