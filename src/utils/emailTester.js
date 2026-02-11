const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfig() {
  console.log('🔧 Testing Email Configuration...\n');
  
  // Show current configuration (hiding password)
  console.log('Email Configuration:');
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`Port: ${process.env.EMAIL_PORT}`);
  console.log(`User: ${process.env.EMAIL_USER}`);
  console.log(`Password: ${process.env.EMAIL_PASS ? '***CONFIGURED***' : 'NOT SET'}`);
  console.log('');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log('📡 Connecting to email server...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email server connection successful!\n');

    // Send test email
    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: '🧪 Auth Microservice - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">🧪 Email Configuration Test</h2>
          <p>Si recibes este email, la configuración es correcta.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Detalles de la prueba:</h3>
            <ul>
              <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Servidor:</strong> ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}</li>
              <li><strong>Usuario:</strong> ${process.env.EMAIL_USER}</li>
            </ul>
          </div>
          <p style="color: #28a745;">✅ El servicio de email está funcionando correctamente.</p>
        </div>
      `,
    };

    console.log('📧 Sending test email...');
    const result = await transporter.sendMail(testEmail);
    
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Response: ${result.response}`);
    
  } catch (error) {
    console.error('❌ Email configuration failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Verifica que el email y contraseña son correctos');
      console.log('2. Para Gmail, usa una "App Password" (no tu contraseña normal)');
      console.log('3. Activa "Less secure app access" en tu cuenta de Gmail');
      console.log('4. Verifica que 2FA esté configurado correctamente en Gmail');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Verifica el host y puerto (smtp.gmail.com:587)');
      console.log('2. Revisa tu conexión a internet');
      console.log('3. Verifica que no haya firewall bloqueando el puerto 587');
    }
  }
}

// Run the test
testEmailConfig().catch(console.error);
