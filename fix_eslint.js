const fs = require('fs');

let code = fs.readFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', 'utf8');

// 1. Convert NavBar
code = code.replace(
  /const NavBar = \(\{\s*activeTab\s*\}\) => \(/g,
  'const renderNavBar = (activeTab) => ('
);
// Replace <NavBar activeTab="xxx" /> with {renderNavBar("xxx")}
code = code.replace(/<NavBar activeTab="([^"]+)" \/>/g, '{renderNavBar("$1")}');
// Replace <NavBar /> with {renderNavBar()}
code = code.replace(/<NavBar \/>/g, '{renderNavBar()}');

// 2. Convert StepIndicator
code = code.replace(
  /const StepIndicator = \(\{\s*current\s*\}\) => \{/g,
  'const renderStepIndicator = (current) => {'
);
// Replace <StepIndicator current={1} /> with {renderStepIndicator(1)}
code = code.replace(/<StepIndicator current={(\d+)} \/>/g, '{renderStepIndicator($1)}');

fs.writeFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', code);
console.log('Fixed React static-components warning!');
