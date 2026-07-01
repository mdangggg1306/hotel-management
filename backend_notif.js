const fs = require('fs');

let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const apiEndpoints = `
app.get('/api/user/notifications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/user/notifications/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { is_read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});
`;

if (!code.includes('/api/user/notifications"')) {
  code = code.replace(
    /app\.get\('\/api\/user\/notifications\/stream'/g,
    `${apiEndpoints}\napp.get('/api/user/notifications/stream'`
  );
}

const checkOutRegex = /broadcastUserNotification\(booking\.guest_id,\s*\{\s*type:\s*'checkout_success',\s*title:\s*'(.*?)',\s*message:\s*`(.*?)`,\s*earnedPoints,\s*newTier:\s*null\s*\}\);/s;

if (code.match(checkOutRegex)) {
  code = code.replace(checkOutRegex, (match, title, message) => {
    return `await prisma.notification.create({
          data: {
            user_id: booking.guest_id,
            type: 'checkout_success',
            title: '${title}',
            message: \`${message}\`
          }
        });\n        ${match}`;
  });
}

fs.writeFileSync('backend/src/index.ts', code);
console.log('Backend notification API updated!');
