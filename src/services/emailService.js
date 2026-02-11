const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(email, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h2>Email Verification</h2>
        <p>Thank you for registering! Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendTwoFactorCodeEmail(email, code) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Two-Factor Authentication Code',
      html: `
        <h2>Two-Factor Authentication</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px;">${code}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please secure your account immediately.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending 2FA email:', error);
      throw new Error('Failed to send 2FA code email');
    }
  }

  async sendAccountLockedEmail(email) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Account Temporarily Locked',
      html: `
        <h2>Account Security Alert</h2>
        <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
        <p>This is a security measure to protect your account. The lock will expire after 15 minutes.</p>
        <p>If you didn't attempt to log in, please secure your account by:</p>
        <ul>
          <li>Changing your password</li>
          <li>Enabling two-factor authentication</li>
          <li>Checking for any suspicious activity</li>
        </ul>
        <p>If you continue to experience issues, please contact support.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending account locked email:', error);
      throw new Error('Failed to send account locked email');
    }
  }
}

module.exports = new EmailService();
