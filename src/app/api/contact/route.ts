import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema matching the form
const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().nullable().optional(),
  query_type: z.string().min(1),
  service_type: z.string().min(2).max(200),
  message: z.string().min(10).max(2000),
});

// Simple in-memory rate limiting for Vercel
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entries when map gets large
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) rateLimitMap.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Sanitize HTML to prevent XSS
function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact us directly.' },
        { status: 503 }
      );
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Sanitize all inputs
    const sanitizedData = {
      name: sanitizeHtml(validatedData.name.trim()),
      email: validatedData.email.toLowerCase().trim(),
      query_type: sanitizeHtml(validatedData.query_type),
      service_type: sanitizeHtml(validatedData.service_type.trim()),
      message: sanitizeHtml(validatedData.message.trim()),
    };

    // Get configuration from environment
    const contactEmail = process.env.CONTACT_EMAIL;
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    
    if (!contactEmail) {
      console.error('CONTACT_EMAIL is not configured');
      return NextResponse.json(
        { error: 'Contact email is not configured. Please contact us directly.' },
        { status: 503 }
      );
    }

    // Format query type for display
    const queryTypeDisplay = sanitizedData.query_type === 'services' ? 'Services' : 'Properties';

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: `Bathala Enterprises <${senderEmail}>`,
      to: contactEmail,
      replyTo: sanitizedData.email,
      subject: `New ${queryTypeDisplay} Inquiry from ${sanitizedData.name}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">BATHALA ENTERPRISES</h1>
              <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px; font-weight: 400;">Premium Real Estate Services</p>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background-color: #dbeafe; padding: 16px 30px; border-bottom: 1px solid #bfdbfe;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="width: 24px; vertical-align: middle;">
                    <div style="width: 8px; height: 8px; background-color: #2563eb; border-radius: 50%; animation: pulse 2s infinite;"></div>
                  </td>
                  <td style="color: #1e40af; font-size: 14px; font-weight: 600;">
                    New inquiry received via website contact form
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              
              <!-- Customer Info Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                      Customer Information
                    </h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 13px; width: 100px; vertical-align: top;">Full Name</td>
                        <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 600;">${sanitizedData.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 13px; vertical-align: top;">Email</td>
                        <td style="padding: 10px 0;">
                          <a href="mailto:${sanitizedData.email}" style="color: #2563eb; font-size: 15px; text-decoration: none; font-weight: 500;">${sanitizedData.email}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Inquiry Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                      Inquiry Details
                    </h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 13px; width: 100px; vertical-align: top;">Category</td>
                        <td style="padding: 10px 0;">
                          <span style="display: inline-block; background-color: #1e3a8a; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">${queryTypeDisplay}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 13px; vertical-align: top;">Interest</td>
                        <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${sanitizedData.service_type}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Message Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #fefce8; border-radius: 12px; border-left: 4px solid #eab308;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="color: #854d0e; margin: 0 0 16px 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Message
                    </h2>
                    <p style="color: #713f12; margin: 0; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${sanitizedData.message}</p>
                  </td>
                </tr>
              </table>

              <!-- Reply Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="mailto:${sanitizedData.email}?subject=Re: Your Inquiry at Bathala Enterprises" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
                      Reply to ${sanitizedData.name.split(' ')[0]}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 12px;">
                Received on ${new Date().toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} IST
              </p>
              <p style="color: #64748b; margin: 0; font-size: 11px;">
                This is an automated notification from your website contact form.
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

    // Check for Resend errors
    if (emailResult.error) {
      console.error('Resend API error:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again or contact us directly.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Inquiry submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data. Please check your inputs.' },
        { status: 400 }
      );
    }

    // Log unexpected errors (won't expose to client)
    console.error('Unexpected contact form error:', error);

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
