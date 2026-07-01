const fs = require('fs');

let code = fs.readFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', 'utf8');

// 1. Fix UPSELLS prices
code = code.replace(/price: 120/g, 'price: 3000000');
code = code.replace(/price: 85/g, 'price: 2125000');
code = code.replace(/price: 160/g, 'price: 4000000');
code = code.replace(/price: 390/g, 'price: 9750000');

// 2. Fix UPSELLS descriptions (optional, $150 to 3.750.000đ)
code = code.replace(/\$150/g, '3.750.000đ');

// 3. Fix Point Logic
code = code.replace(
  /const maxDiscountPoints = Math.min\(userPoints, subTotal \* 23\)/g,
  'const maxDiscountPoints = Math.min(userPoints, Math.floor(subTotal / 1000))'
);
code = code.replace(
  /const pointsDiscountUSD = usePoints \? Math.floor\(maxDiscountPoints \/ 23\) : 0/g,
  'const pointsDiscountVND = usePoints ? maxDiscountPoints * 1000 : 0'
);
code = code.replace(
  /const pointsRedeemed = usePoints \? pointsDiscountUSD \* 23 : 0/g,
  'const pointsRedeemed = usePoints ? maxDiscountPoints : 0'
);
code = code.replace(
  /const grandTotal = subTotal - pointsDiscountUSD/g,
  'const grandTotal = subTotal - pointsDiscountVND'
);
code = code.replace(/pointsDiscountUSD/g, 'pointsDiscountVND'); // Fix variables later in the file

// 4. UI Rendering Formats (regex)
// We look for \${...} inside JSX or `$${...}.00`
// Examples:
// \${(booking.roomType?.base_price * nights).toLocaleString()}.00
// \${u.price.toLocaleString()}.00
// \${booking.total_amount.toLocaleString()}.00
// \${b.total_amount.toLocaleString()}
// \${roomTotal.toLocaleString()}.00
// \${taxAmount.toLocaleString()}.00
// \${resortFee}.00
// \${u.price}.00
// -\${pointsDiscountVND}.00
// \${grandTotal.toLocaleString()}.00
// Tiết kiệm \${Math.floor(maxDiscountPoints/23)}.00 (23 điểm = $1)
// \${r.price.toLocaleString()} / Đêm

// A robust regex to find `${variable_name}` and replace with `{variable_name.toLocaleString('vi-VN')}đ`
// Wait, the syntax is like <span>${roomTotal.toLocaleString()}.00</span> -> we want <span>{roomTotal.toLocaleString('vi-VN')}đ</span>
code = code.replace(/>\$\{(.*?\.toLocaleString\(\))\}(?:\.00)?</g, '>{$1.replace(/,/g, ".")}đ<'); // temporary replace to dot for locale vi-VN if toLocaleString() has no arg
code = code.replace(/>\$\{(.*?\.toLocaleString\('vi-VN'\))\}(?:\.00)?</g, '>{$1}đ<'); 
code = code.replace(/>\$\{(.*?)\}\.00</g, '>{($1).toLocaleString(\'vi-VN\')}đ<');
code = code.replace(/>\$\{(.*?)\}</g, '>{($1).toLocaleString(\'vi-VN\')}đ<');

// Some specific fixes:
code = code.replace(/\.toLocaleString\(\)/g, ".toLocaleString('vi-VN')");
code = code.replace(/-\$\{pointsDiscountVND\}\.00/g, '-{pointsDiscountVND.toLocaleString(\'vi-VN\')}đ');
code = code.replace(/-\{(pointsDiscountVND\.toLocaleString\('vi-VN'\))\}đ</g, '-{$1}đ<');
code = code.replace(/Thanh toán bằng USD/g, 'Thanh toán bằng VNĐ');
code = code.replace(
  /Tiết kiệm \{(.*?)\}\.00 \(23 điểm = \$1\)/g,
  'Tiết kiệm {(maxDiscountPoints * 1000).toLocaleString(\'vi-VN\')}đ (1 điểm = 1.000đ)'
);

// Success step: <strong>{(grandTotal * 23000).toLocaleString('vi-VN')}đ</strong>
code = code.replace(/\{\(grandTotal \* 23000\)\.toLocaleString\('vi-VN'\)\}đ/g, '{grandTotal.toLocaleString(\'vi-VN\')}đ');

fs.writeFileSync('Luxury Hotel/src/pages/UserPortalPage.jsx', code);
console.log('Currency UI updated!');
