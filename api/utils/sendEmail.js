const nodeMailer = require('nodemailer');

exports.sendMail = async (transportObj) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: '"Lawal A" <lawahm303@gmail.com>',
    to: transportObj.to,
    subject: transportObj.subject,
    text: transportObj.text,
  });
};
