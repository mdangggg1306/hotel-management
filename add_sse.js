const fs = require('fs');

let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// Add User SSE tracking
if (!code.includes('userSseClients')) {
  code = code.replace(
    /const sseClients = new Set<Response>\(\);/g,
    `const sseClients = new Set<Response>();\nconst userSseClients = new Map<number, Response[]>();`
  );

  const userSseEndpoint = `
app.get('/api/user/notifications/stream', authenticateToken, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const userId = (req as any).user.id;
  if (!userSseClients.has(userId)) {
    userSseClients.set(userId, []);
  }
  userSseClients.get(userId)?.push(res);

  res.write(\`data: \${JSON.stringify({ type: 'connected', message: 'Connected to user notifications' })}\\n\\n\`);

  const heartbeat = setInterval(() => res.write(': heartbeat\\n\\n'), 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = userSseClients.get(userId) || [];
    userSseClients.set(userId, clients.filter(c => c !== res));
  });
});

function broadcastUserNotification(userId: number, dataObj: object) {
  const clients = userSseClients.get(userId) || [];
  const dataString = \`data: \${JSON.stringify(dataObj)}\\n\\n\`;
  clients.forEach(client => {
    try { client.write(dataString); } catch {}
  });
}
`;

  code = code.replace(
    /function broadcastNotification\(notification: object\) \{[\s\S]*?\}/,
    `$&${userSseEndpoint}`
  );
}

// Modify PUT /api/admin/bookings/:id/status to send User Notification
const checkOutMatch = /earnedPoints = Math\.floor\(booking\.total_amount \/ 100000\);/g;
if (code.match(checkOutMatch)) {
  const notificationLogic = `earnedPoints = Math.floor(booking.total_amount / 100000);
          
          broadcastUserNotification(guest_id, {
            type: 'checkout_success',
            title: '🎉 Hoàn tất lưu trú',
            message: \`Cảm ơn bạn đã lưu trú! Bạn vừa nhận được \${earnedPoints} điểm thưởng.\`,
            earnedPoints,
            newTier: null // (we could add this)
          });`;
  code = code.replace(checkOutMatch, notificationLogic);
}

fs.writeFileSync('backend/src/index.ts', code);
console.log('Backend SSE updated!');
