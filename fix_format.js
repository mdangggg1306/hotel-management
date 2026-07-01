const fs = require('fs');
let code = fs.readFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', 'utf8');

code = code.replace(/<span>\$\{r\.price\.toLocaleString\('vi-VN'\)\} × \{nights\} đêm<\/span>/g, "<span>{r.price.toLocaleString('vi-VN')}đ × {nights} đêm</span>");
code = code.replace(/<div className="upsell-price">\+\$\{u\.price\}\.00<\/div>/g, '<div className="upsell-price">+{u.price.toLocaleString(\'vi-VN\')}đ</div>');
code = code.replace(/Tiết kiệm \$\{Math\.floor\(maxDiscountPoints\/23\)\}\.00 \(23 điểm = \$1\)/g, "Tiết kiệm {(maxDiscountPoints * 1000).toLocaleString('vi-VN')}đ (1 điểm = 1.000đ)");
code = code.replace(/Xác Nhận & Thanh Toán \$\{grandTotal\.toLocaleString\('vi-VN'\)\}/g, "Xác Nhận & Thanh Toán {grandTotal.toLocaleString('vi-VN')}đ");
code = code.replace(/<span className="info-val price">\$\{total\.toLocaleString\('vi-VN'\)\}<\/span>/g, '<span className="info-val price">{total.toLocaleString(\'vi-VN\')}đ</span>');

fs.writeFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', code);
console.log("Fixed $ signs!");
