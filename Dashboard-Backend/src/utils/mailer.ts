import nodemailer from "nodemailer";
import config from "../config";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendOTPEmail = async (
  to: string,
  otp: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"Byte-Bandits Support" <${config.email.from || config.email.user}>`,
      to,
      subject: "OTP for ZIA Herbal Pro",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f6fff0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            
            <div style="background-color: #364A28; padding: 20px; color: #ffffff; text-align: center;">
              <h2 style="margin: 0;">Verify Your Email</h2>
            </div>

            <div style="padding: 30px; text-align: center;">
              <p style="font-size: 16px; color: #333333;">Your OTP code is:</p>

              <div style="margin: 20px 0;">
                <span style="display: inline-block; padding: 10px 20px; background-color: #364A28; color: #ffffff; font-size: 24px; border-radius: 5px; letter-spacing: 4px;">
                  ${otp}
                </span>
              </div>

              <p style="font-size: 14px; color: #777777;">
                Valid for 10 minutes. Do not share with anyone.
              </p>
            </div>

            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999999;">
              © ${new Date().getFullYear()} ZIA Herbal Pro. All rights reserved.
            </div>

          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

export const sendCredentialsEmail = async (
  to: string,
  username: string,
  password: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"Byte-Bandits Support" <${config.email.from || config.email.user}>`,
      to,
      subject: "Your Account Credentials - ZIA Herbal Pro",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f6fff0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            
            <div style="background-color: #364A28; padding: 20px; color: #ffffff; text-align: center;">
              <h2 style="margin: 0;">Account Created</h2>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #333333;">Your account has been created. Use the following credentials to log in:</p>

              <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
              </div>

              <p style="font-size: 14px; color: #777777;">
                Please change your password after your first login.
              </p>
            </div>

            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999999;">
              © ${new Date().getFullYear()} ZIA Herbal Pro. All rights reserved.
            </div>

          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Credentials email error:", error);
    return false;
  }
};

export interface AssignmentEmailPayload {
  to: string;
  assigneeName?: string;
  title: string;
  description?: string | null;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  milestone?: { completed: number; total: number };
  createdByName?: string | null;
  assignmentId: string;
  appUrl?: string;
}

export const sendAssignmentNotificationEmail = async (
  payload: AssignmentEmailPayload
): Promise<boolean> => {
  const {
    to,
    assigneeName,
    title,
    description,
    priority = "medium",
    status = "new",
    dueDate,
    milestone,
    createdByName,
    assignmentId,
    appUrl = config.appUrl || "https://crm.thebytebandits.com",
  } = payload;

  if (!to || !to.includes("@")) {
    console.warn("[Mailer] Skipped email: invalid recipient", to);
    return false;
  }

  const priorityColor =
    priority.toLowerCase() === "high"
      ? "#ef4444"
      : priority.toLowerCase() === "low"
      ? "#3b82f6"
      : "#f59e0b";

  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
  const statusLabel = status.replace(/_/g, " ").toUpperCase();
  const cleanDescription = description
    ? description.replace(/<[^>]*>?/gm, "").trim()
    : "No detailed description provided.";
  const displayDescription =
    cleanDescription.length > 300
      ? cleanDescription.substring(0, 300) + "..."
      : cleanDescription;

  const directLink = `${appUrl}/work/details/${encodeURIComponent(assignmentId)}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Work Assignment</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      </style>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; text-align: left;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display: inline-block; padding: 4px 10px; background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 9999px; letter-spacing: 0.05em; margin-bottom: 8px;">
                    Work Management
                  </span>
                  <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3;">
                    New Assignment Notification
                  </h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Greeting & Content -->
        <tr>
          <td style="padding: 32px 32px 24px 32px;">
            <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0; line-height: 1.5;">
              Hello <strong>${assigneeName || "Team Member"}</strong>,
            </p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0; line-height: 1.5;">
              You have been assigned to a new work assessment by <strong>${createdByName || "a team administrator"}</strong>.
            </p>

            <!-- Card -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <tr>
                <td style="padding-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Assignment Title</span>
                  <div style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 4px; line-height: 1.3;">
                    ${title}
                  </div>
                </td>
              </tr>

              <!-- Badges -->
              <tr>
                <td style="padding-bottom: 16px;">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right: 8px;">
                        <span style="display: inline-block; padding: 4px 10px; background-color: ${priorityColor}15; color: ${priorityColor}; border: 1px solid ${priorityColor}30; border-radius: 6px; font-size: 12px; font-weight: 700;">
                          ● ${priorityLabel} Priority
                        </span>
                      </td>
                      <td style="padding-right: 8px;">
                        <span style="display: inline-block; padding: 4px 10px; background-color: #e2e8f0; color: #334155; border-radius: 6px; font-size: 12px; font-weight: 600;">
                          ${statusLabel}
                        </span>
                      </td>
                      ${
                        dueDate
                          ? `<td>
                              <span style="display: inline-block; padding: 4px 10px; background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px;">
                                Due: ${dueDate}
                              </span>
                            </td>`
                          : ""
                      }
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Milestone -->
              ${
                milestone
                  ? `<tr>
                      <td style="padding-bottom: 14px;">
                        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Milestone Progress</span>
                        <div style="font-size: 13px; color: #334155; font-weight: 600; margin-top: 2px;">
                          ${milestone.completed} of ${milestone.total} milestones completed (${Math.round((milestone.completed / Math.max(1, milestone.total)) * 100)}%)
                        </div>
                      </td>
                    </tr>`
                  : ""
              }

              <!-- Description -->
              <tr>
                <td>
                  <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Description</span>
                  <p style="font-size: 13px; color: #475569; margin: 4px 0 0 0; line-height: 1.5; white-space: pre-line;">
                    ${displayDescription}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Button CTA -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
              <tr>
                <td align="center">
                  <a href="${directLink}" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; box-shadow: 0 2px 4px rgba(37,99,235,0.25);">
                    View Assignment in Dashboard →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
            <p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0;">
              This is an automated notification from the Byte-Bandits Work Management Dashboard.
            </p>
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
              © ${new Date().getFullYear()} Byte-Bandits. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const fromAddress = `"Byte-Bandits Work Management" <${config.email.from || config.email.user}>`;
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `New Assignment: "${title}" [${priorityLabel}]`,
      html,
    });
    console.log(`[Mailer] Successfully sent assignment email to: ${to}`);
    return true;
  } catch (error) {
    console.error(`[Mailer] Error sending assignment email to ${to}:`, error);
    return false;
  }
};
