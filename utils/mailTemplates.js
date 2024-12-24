const logoUrl = 'https://cloud-6t1azuxh2-hack-club-bot.vercel.app/0siddhi.png';

const mainHtml = (body) => `
 <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Password Update Confirmation</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
            .highlight {
                font-weight: bold;
            }
        </style>
    </head>
${body}
    </html>`;

export const passwordUpdated = (email, name) => {
  return mainHtml(
    `<body>
        <div class="container">
            <a href="#"><img class="logo"
                    src="${logoUrl}" alt="Siddhi Logo"></a>
            <div class="message">Password Update Confirmation</div>
            <div class="body">
                <p>Hey ${name},</p>
                <p>Your password has been successfully updated for the email <span class="highlight">${email}</span>.
                </p>
                <p>If you did not request this password change, please contact us immediately to secure your account.</p>
            </div>
            <div class="support">If you have any questions or need further assistance, please feel free to reach out to us
                at
                <a href="mailto:info@siddhi.com">info@siddhi.com</a>. We are here to help!
            </div>
        </div>
    </body>`
  );
};
export const passwordReset = (email, name, resetLink) => {
  return mainHtml(
    `<body>
    <div class="container">
        <a href="#"><img class="logo" 
                src="${logoUrl}" alt="Siddhi Logo"></a>
        <div class="message">Password Reset Request</div>
        <div class="body">
            <p>Hey ${name},</p>
            <p>We received a request to reset the password for your account associated with the email <span class="highlight">${email}</span>.</p>
            <p>If you made this request, please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 20px;">
                <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
                    Reset Your Password
                </a>
            </div>
            <p>If you did not request this, please ignore this email or contact us to secure your account.</p>
        </div>
        <div class="support">
            If you have any questions or need further assistance, please feel free to reach out to us at 
            <a href="mailto:info@siddhi.com">info@siddhi.com</a>. We are here to help!
        </div>
    </div>
</body>`
  );
};
export const welcomeEmail = (email, name) => {
  return mainHtml(
    `<body>
    <div class="container">
        <a href="#"><img class="logo" 
                src="${logoUrl}" alt="Siddhi Logo"></a>
        <div class="message">Thank You for Registering!</div>
        <div class="body">
            <p>Hi ${name},</p>
            <p>Thank you for registering with <strong>Siddhi</strong>. We're excited to have you on board!</p>
            <p>To get started, please log in to your account using the link below:</p>
            <div style="text-align: center; margin: 20px;">
                <a href="" style="background-color: #0E18CF; color: white; padding: 15px 25px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
                    Log in to Your Account
                </a>
            </div>
            <p>If you have any questions or need assistance, feel free to reach out to us</p>
        </div>
        <div class="support">
            If you have any questions or need further assistance, please contact us at 
            <a href="mailto:info@siddhi.com">info@siddhi.com</a>. We're happy to assist you!
        </div>
    </div>
</body>`
  );
};

export const verifyAccount = (email, otp) => {
  return mainHtml(`
<body>
    <div class="container">
        <a href="#"><img class="logo" 
                src="${logoUrl}" alt="Siddhi Logo"></a>
        <div class="message">Thank You for Registering!</div>
        <div class="body">
            <p>Hi ${email},</p>
            <p>Thank you for registering with <strong>Siddhi</strong>. We’re excited to have you on board!</p>
            <p>To verify your account and complete your registration, please use the following OTP:</p>
            <div style="text-align: center; margin: 20px;">
                <div style="font-size: 20px; font-weight: bold; padding: 15px; background-color: #F4F6F9; border-radius: 5px;">
                    <strong>${otp}</strong>
                </div>
            </div>
            <p>Please enter this OTP on the verification page to complete your sign-up process.</p>
            <p>If you did not request this verification, please ignore this email.</p>
        </div>
        <div class="support">
            If you have any questions or need further assistance, please contact us at 
            <a href="mailto:support@siddhi.com">support@siddhi.com</a>. We're happy to assist you!
        </div>
    </div>
</body>
`);
};
