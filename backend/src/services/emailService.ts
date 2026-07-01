import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Luxury Hotel Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Luxury Hotel - Đặt lại mật khẩu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #111827; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Luxury Hotel của bạn. Nếu bạn không yêu cầu điều này, xin hãy bỏ qua email này.</p>
        <p>Để đặt lại mật khẩu, vui lòng click vào nút bên dưới (Liên kết có hiệu lực trong 30 phút):</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">ĐẶT LẠI MẬT KHẨU</a>
        </div>
        <p>Trân trọng,<br>Đội ngũ Luxury Hotel</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendBookingConfirmationEmail = async (to: string, bookingDetails: any) => {
  const mailOptions = {
    from: `"Luxury Hotel Reservations" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Xác nhận đặt phòng thành công - Mã số ${bookingDetails.booking_code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ca8a04; font-family: Georgia, serif;">Luxury Hotel</h1>
        </div>
        <h2 style="color: #111827;">Xác nhận đặt phòng thành công!</h2>
        <p>Kính gửi quý khách ${bookingDetails.guestName},</p>
        <p>Cảm ơn quý khách đã lựa chọn dịch vụ của chúng tôi. Dưới đây là thông tin chi tiết về đặt phòng của quý khách:</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Mã đặt phòng:</strong> ${bookingDetails.booking_code}</p>
          <p><strong>Loại phòng:</strong> ${bookingDetails.roomTypeName}</p>
          <p><strong>Nhận phòng:</strong> ${new Date(bookingDetails.check_in).toLocaleDateString('vi-VN')}</p>
          <p><strong>Trả phòng:</strong> ${new Date(bookingDetails.check_out).toLocaleDateString('vi-VN')}</p>
          <p><strong>Tổng tiền đã thanh toán:</strong> $${bookingDetails.total_amount}</p>
        </div>
        
        <p>Nếu có bất kỳ thay đổi hoặc yêu cầu đặc biệt nào, xin vui lòng liên hệ với dịch vụ Quản gia 24/7 của chúng tôi.</p>
        <p>Kính chúc quý khách một kỳ nghỉ tuyệt vời!</p>
        <p>Trân trọng,<br>Luxury Hotel Hospitality</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
