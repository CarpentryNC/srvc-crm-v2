// Simple SendGrid email test
// Make sure you have SENDGRID_API_KEY in your .env file

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Set API key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'carolinacarpentry.owner@gmail.com', // Change to your verified recipient
  from: 'samir.emailme@gmail.com', // Must be your verified sender in SendGrid
  subject: 'SRVC CRM Email Test',
  text: 'This is a test email from your SRVC CRM application using SendGrid!',
  html: '<h2>SRVC CRM Email Test</h2><p>This is a test email from your <strong>SRVC CRM</strong> application using SendGrid!</p><p>✅ Email functionality is working correctly!</p>',
};

console.log('Sending test email...');
console.log('API Key configured:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
console.log('From:', msg.from);
console.log('To:', msg.to);

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!');
    console.log('Check your inbox at:', msg.to);
  })
  .catch((error) => {
    console.error('❌ Error sending email:');
    console.error(error.response ? error.response.body : error);
  });
