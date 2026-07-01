const fs = require('fs');

let code = fs.readFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', 'utf8');

// 1. Inject State
if (!code.includes('const [darkMode')) {
  const statesToInject = `
  const [darkMode, setDarkMode] = useState(localStorage.getItem('luxury_hotel_theme') === 'dark');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('luxury_hotel_theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('luxury_hotel_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (user) {
      fetch('/api/user/notifications', {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('luxury_hotel_token')}\` }
      })
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(console.error);
    }
  }, [user]);

  const markNotificationAsRead = async (id) => {
    try {
      await fetch(\`/api/user/notifications/\${id}/read\`, {
        method: 'PUT',
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('luxury_hotel_token')}\` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) { console.error(e); }
  };
`;
  code = code.replace(/const \[usePoints, setUsePoints\] = useState\(false\)/, `const [usePoints, setUsePoints] = useState(false)\n${statesToInject}`);
}

// 2. Refetch notifications on SSE
if (!code.includes('fetch(\'/api/user/notifications\'')) {
    // Wait, the previous block already added fetch inside useEffect. I need to make sure the SSE block updates notifications too.
    code = code.replace(
      /setUserPoints\(prev => prev \+ evtData\.earnedPoints\);/g,
      `setUserPoints(prev => prev + evtData.earnedPoints);\n            fetch('/api/user/notifications', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('luxury_hotel_token') } }).then(r => r.json()).then(d => setNotifications(d));`
    );
}

// 3. Inject UI
const navUI = `
          <button className="up-nav-search" onClick={() => setDarkMode(!darkMode)} title="Giao diện Sáng/Tối">
            {darkMode ? '🌙' : '☀️'}
          </button>
          
          <div className="up-avatar-wrap" style={{ position: 'relative' }}>
            <div className="up-avatar" onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}>
              🔔
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, background: 'red', color: 'white', fontSize: 10, borderRadius: '50%', padding: '2px 5px', minWidth: 16, textAlign: 'center' }}>
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </div>
            {showNotifications && (
              <div className="user-dropdown-menu" style={{ width: 320, padding: 0 }}>
                <div className="ud-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                  <strong>Thông báo của bạn</strong>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Chưa có thông báo nào</div>
                  ) : notifications.map(n => (
                    <div key={n.id} onClick={() => { if(!n.is_read) markNotificationAsRead(n.id) }} style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: n.is_read ? 'transparent' : 'rgba(201,168,76,0.1)', cursor: 'pointer' }}>
                      <div className="ud-header" style={{ padding: 0 }}>
                        <strong style={{ fontSize: 13, color: n.is_read ? 'inherit' : '#c9a84c' }}>{n.title}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, marginTop: 4 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
`;

if (!code.includes('🔔')) {
  code = code.replace(
    /        <div className="up-nav-right">\s*<button className="up-nav-search">[\s\S]*?Tìm kiếm\s*<\/button>/,
    `        <div className="up-nav-right">\n${navUI}`
  );
  // hide notifications when user menu opens
  code = code.replace(
    /onClick=\{\(\) => setShowUserMenu\(!showUserMenu\)\}/,
    `onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}`
  );
}

fs.writeFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', code);
console.log('Frontend Notification & Dark Mode injected!');
