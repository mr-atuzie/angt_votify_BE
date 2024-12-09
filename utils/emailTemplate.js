const VerifyEmail = (name, verificationCode) => {
  return (message = `
             <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 5px; overflow: hidden;">
            <div style="background-color: #FF5D2E; padding: 20px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0;">Welcome!</h1>
            </div>
            <div style="padding: 20px;">
                <p style="text-transform: capitalize;">Hi <strong>${name}</strong>,</p>
                <p> Please use the following verification code to complete your sign-up process:</p>
                <p style="font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0;">${verificationCode}</p>
                <p>If you did not request this code, please ignore this email.</p>
                <p>Best regards,<br>Secure Auth</p>
            </div>
            <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
                <p style="margin: 0;">&copy; 2024 Secure Auth. All rights reserved.</p>
            </div>
        </div>
    </body>`);
};

module.exports = { VerifyEmail };
