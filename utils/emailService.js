const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter on startup (IMPORTANT)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready');
  }
});

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"Ali Technologies" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset - Ali Technologies',
    html: `
      <h2>ALI. | Ali Technologies</h2>
      <p>Hello <b>${userName}</b>,</p>
      <p>You requested a password reset.</p>
      <p>
        <a href="${resetUrl}" 
           style="padding:12px 20px;background:#6c63ff;color:#fff;text-decoration:none;border-radius:6px;">
           Reset Password
        </a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn’t request this, ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
