const forgotPasswordOtpTemplate = (name, otp) => {
  const body = `
  <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f9fafb; color:#333;">
      
      <!-- Container -->
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
        <tr>
          <td align="center">
            
            <!-- Card -->
            <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding:30px; text-align:center; color:#fff;">
                  <h1 style="margin:0; font-size:24px;">IBS Niyojan</h1>
                  <p style="margin:8px 0 0; font-size:14px; opacity:0.9;">Password Reset Request</p>
                </td>
              </tr>

              <!-- Image -->
              <tr>
                <td align="center" style="padding:20px;">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" 
                    alt="Security Icon" 
                    width="80" 
                    style="display:block;" 
                  />
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:0 30px 30px;">
                  
                  <h2 style="color:#dc2626; margin-bottom:10px;">
                    Hello ${name || "User"},
                  </h2>

                  <p style="font-size:14px; line-height:1.6;">
                    We received a request to reset your password for your <strong>IBS Niyojan</strong> account.
                  </p>

                  <p style="font-size:14px; line-height:1.6;">
                    Use the One-Time Password (OTP) below to reset your password:
                  </p>

                  <!-- OTP Box -->
                  <div style="text-align:center; margin:25px 0;">
                    <span style="display:inline-block; padding:14px 28px; font-size:30px; font-weight:bold; color:#ffffff; background:#dc2626; border-radius:8px; letter-spacing:4px;">
                      ${otp}
                    </span>
                  </div>

                  <p style="font-size:13px; color:#555;">
                    This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.
                  </p>

                  <p style="font-size:13px; color:#555;">
                    If you didn’t request this, you can safely ignore this email.
                  </p>

                  <!-- Footer -->
                  <p style="margin-top:30px; font-size:14px;">
                    Regards,<br/>
                    <strong>IBS Niyojan Team</strong>
                  </p>

                </td>
              </tr>

            </table>

            <!-- Bottom Note -->
            <p style="font-size:12px; color:#999; margin-top:15px;">
              © ${new Date().getFullYear()} IBS Niyojan. All rights reserved.
            </p>

          </td>
        </tr>
      </table>

    </body>
  </html>
  `;

  return body;
};



const passwordResetSuccessTemplate = (name) => {
  const body = `
  <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f9fafb; color:#333;">
      
      <!-- Container -->
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
        <tr>
          <td align="center">
            
            <!-- Card -->
            <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding:30px; text-align:center; color:#fff;">
                  <h1 style="margin:0; font-size:24px;">IBS Niyojan</h1>
                  <p style="margin:8px 0 0; font-size:14px; opacity:0.9;">Password Reset Successful</p>
                </td>
              </tr>

              <!-- Image -->
              <tr>
                <td align="center" style="padding:20px;">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/845/845646.png" 
                    alt="Success Icon" 
                    width="80" 
                    style="display:block;" 
                  />
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:0 30px 30px;">
                  
                  <h2 style="color:#dc2626; margin-bottom:10px;">
                    Hi ${name || "User"},
                  </h2>

                  <p style="font-size:14px; line-height:1.6;">
                    Your password has been successfully reset for your <strong>IBS Niyojan</strong> account.
                  </p>

                  <p style="font-size:14px; line-height:1.6;">
                    You can now log in using your new password.
                  </p>

                  <!-- Warning Box -->
                  <div style="margin:25px 0; padding:15px; background:#fee2e2; border-left:4px solid #dc2626; border-radius:6px;">
                    <p style="margin:0; font-size:13px; color:#7f1d1d;">
                      If you did NOT perform this action, please contact the administrator immediately to secure your account.
                    </p>
                  </div>

                  <!-- Footer -->
                  <p style="margin-top:30px; font-size:14px;">
                    Regards,<br/>
                    <strong>IBS Niyojan Team</strong>
                  </p>

                </td>
              </tr>

            </table>

            <!-- Bottom Note -->
            <p style="font-size:12px; color:#999; margin-top:15px;">
              © ${new Date().getFullYear()} IBS Niyojan. All rights reserved.
            </p>

          </td>
        </tr>
      </table>

    </body>
  </html>
  `;

  return body;
};

module.exports = {
  forgotPasswordOtpTemplate,
  passwordResetSuccessTemplate
}