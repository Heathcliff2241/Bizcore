import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormEmail, sendContactConfirmationEmail } from '@/lib/email/contactEmails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters long' },
        { status: 400 }
      );
    }

    const contactData = {
      visitorName: name,
      visitorEmail: email,
      subject,
      message,
    };

    // Send email to admin
    try {
      await sendContactFormEmail(contactData);
    } catch (adminEmailError) {
      console.error('Failed to send admin email:', adminEmailError);
      // Continue anyway - still send confirmation
    }

    // Send confirmation email to visitor
    try {
      await sendContactConfirmationEmail(contactData);
    } catch (confirmationError) {
      console.error('Failed to send confirmation email:', confirmationError);
      // Don't fail the request - admin email was more important
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Your message has been sent successfully. We\'ll be in touch soon!' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Contact API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again later.' },
      { status: 500 }
    );
  }
}
