const fs = require('fs');
let code = fs.readFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', 'utf8');

const sseCode = `
      // Listen for Real-time Notifications
      const evtSource = new EventSource(\`/api/user/notifications/stream?token=\${token}\`);
      evtSource.onmessage = (event) => {
        try {
          const evtData = JSON.parse(event.data);
          if (evtData.type === 'checkout_success') {
            showToast(evtData.message, 'success');
            setUserPoints(prev => prev + evtData.earnedPoints);
          }
        } catch(e) {}
      };
`;

code = code.replace(
  /\.catch\(console\.error\);\s+\}\s+\}, \[user\]\);/g,
  `.catch(console.error);\n${sseCode}\n      return () => evtSource.close();\n    }\n  }, [user]);`
);

fs.writeFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', code);
console.log('Frontend SSE added!');
