const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Green Earth Initiative <noreply@greenearthinitiative.online>";
const SITE_URL = "https://greenearthinitiative.online";

/**
 * Send task reminder email to a user
 */
const sendTaskReminder = async (user) => {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: "🌱 You haven't started your eco journey yet!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your First Eco Task</title>
      </head>
      <body style="margin:0;padding:0;background:#f0f7f0;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f0;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1b5e20,#2e7d32);padding:40px 40px 30px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">🌍</div>
                    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;line-height:1.2;">Green Earth Initiative</h1>
                    <p style="color:#a5d6a7;margin:8px 0 0;font-size:14px;">Eco Gamification Platform</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#1b5e20;font-size:18px;font-weight:700;margin:0 0 8px;">Hi ${user.name || "Eco Warrior"} 👋</p>
                    <p style="color:#424242;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      You registered on Green Earth Initiative but haven't completed your first eco task yet. 
                      You're missing out on points, rewards, and a chance to make a real difference for the planet!
                    </p>

                    <!-- Reminder Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5e9;border-radius:12px;border:1px solid #c8e6c9;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px;">
                          <p style="color:#1b5e20;font-weight:800;font-size:16px;margin:0 0 12px;">🎯 Why complete eco tasks?</p>
                          <table cellpadding="0" cellspacing="0">
                            <tr><td style="padding:4px 0;color:#2e7d32;font-size:14px;">✅ Earn points for every approved task</td></tr>
                            <tr><td style="padding:4px 0;color:#2e7d32;font-size:14px;">🏆 Climb the global leaderboard</td></tr>
                            <tr><td style="padding:4px 0;color:#2e7d32;font-size:14px;">🎁 Redeem points for eVouchers &amp; rewards</td></tr>
                            <tr><td style="padding:4px 0;color:#2e7d32;font-size:14px;">🌳 Make a real environmental impact</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Tasks Preview -->
                    <p style="color:#424242;font-size:15px;font-weight:600;margin:0 0 12px;">🌱 Easy tasks to get you started:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#f9fbe7;border-radius:8px;padding:12px 16px;border-left:3px solid #2e7d32;margin-bottom:8px;">
                          <p style="margin:0;color:#1b5e20;font-weight:700;font-size:14px;">Pick Up 10 Pieces of Litter — 15 pts</p>
                        </td>
                      </tr>
                      <tr><td style="height:8px;"></td></tr>
                      <tr>
                        <td style="background:#f9fbe7;border-radius:8px;padding:12px 16px;border-left:3px solid #2e7d32;">
                          <p style="margin:0;color:#1b5e20;font-weight:700;font-size:14px;">Turn Off Lights When Leaving a Room — 10 pts</p>
                        </td>
                      </tr>
                      <tr><td style="height:8px;"></td></tr>
                      <tr>
                        <td style="background:#f9fbe7;border-radius:8px;padding:12px 16px;border-left:3px solid #2e7d32;">
                          <p style="margin:0;color:#1b5e20;font-weight:700;font-size:14px;">Plastic-Free Day — 30 pts</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#2e7d32;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:800;font-size:16px;letter-spacing:0.3px;">
                            🌱 Start Earning Points Now
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f5f5f5;padding:24px 40px;text-align:center;border-top:1px solid #e0e0e0;">
                    <p style="color:#9e9e9e;font-size:12px;margin:0 0 8px;">
                      You received this email because you registered at Green Earth Initiative.
                    </p>
                    <p style="color:#9e9e9e;font-size:12px;margin:0;">
                      © ${new Date().getFullYear()} Green Earth Initiative · 
                      <a href="${SITE_URL}" style="color:#2e7d32;text-decoration:none;">Visit Website</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) throw error;
  return data;
};

/**
 * Send submission approved email
 */
const sendApprovalEmail = async (user, taskTitle, pointsAwarded) => {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: `✅ Your task was approved! +${pointsAwarded} pts`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f0f7f0;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f0;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#1b5e20,#2e7d32);padding:40px;text-align:center;">
                  <div style="font-size:52px;">✅</div>
                  <h1 style="color:#fff;margin:12px 0 0;font-size:24px;font-weight:800;">Task Approved!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="color:#1b5e20;font-size:18px;font-weight:700;margin:0 0 16px;">Hi ${user.name || "Eco Warrior"} 🎉</p>
                  <p style="color:#424242;font-size:15px;line-height:1.6;margin:0 0 24px;">
                    Your submission for <strong>"${taskTitle}"</strong> has been reviewed and approved by our admin team.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5e9;border-radius:12px;border:1px solid #c8e6c9;margin-bottom:28px;">
                    <tr><td style="padding:24px;text-align:center;">
                      <p style="color:#9e9e9e;font-size:13px;margin:0 0 4px;">Points Awarded</p>
                      <p style="color:#1b5e20;font-size:40px;font-weight:900;margin:0;">+${pointsAwarded}</p>
                      <p style="color:#2e7d32;font-size:14px;font-weight:700;margin:4px 0 0;">Added to your account</p>
                    </td></tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center">
                      <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#2e7d32;color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:800;font-size:16px;">
                        View My Points →
                      </a>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #e0e0e0;">
                  <p style="color:#9e9e9e;font-size:12px;margin:0;">© ${new Date().getFullYear()} Green Earth Initiative · <a href="${SITE_URL}" style="color:#2e7d32;text-decoration:none;">greenearthinitiative.online</a></p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) throw error;
  return data;
};

module.exports = { sendTaskReminder, sendApprovalEmail };
