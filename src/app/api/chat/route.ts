import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPropertiesFromSupabase, getServicesFromSupabase } from '@/lib/supabase-queries';

// Initialize Gemini - use server-side env var (without NEXT_PUBLIC prefix for security)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

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

// Cache for RAG context (refresh every 5 minutes)
let cachedContext: string | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getRAGContext(): Promise<string> {
  const now = Date.now();
  
  if (cachedContext && (now - cacheTime) < CACHE_DURATION) {
    return cachedContext;
  }

  try {
    const [properties, services] = await Promise.all([
      getPropertiesFromSupabase(),
      getServicesFromSupabase()
    ]);

    const propertiesContext = properties.length > 0
      ? properties.map(p => 
          `- Property: "${p.title}" | Location: ${p.location} | Type: ${p.type} | Price: ₹${p.price.toLocaleString('en-IN')}${p.type !== 'Sale' ? '/month' : ''} | Bedrooms: ${p.bedrooms} | Area: ${p.sqft} sqft | Description: ${p.description || 'Premium property'}`
        ).join('\n')
      : 'No properties currently listed.';

    const servicesContext = services.length > 0
      ? services.map(s => 
          `- Service: "${s.title}" | Description: ${s.description} | Price Range: ${s.price_range || 'Contact for pricing'}`
        ).join('\n')
      : 'No services currently listed.';

    cachedContext = `
BATHALA ENTERPRISES - REAL ESTATE COMPANY DATA

COMPANY INFORMATION:
- Name: Bathala Enterprises
- Location: Chikkapatre Main Road, Basapura, Bangalore 560100
- Phone: +91 98765 43210
- Email: contact@bathalaenterprises.com
- Website: bathalaenterprises.com
- Operating Hours: 9 AM - 6 PM (Monday to Saturday)

AVAILABLE PROPERTIES:
${propertiesContext}

SERVICES OFFERED:
${servicesContext}

LOCATION CONTEXT:
- Kempegowda International Airport (Bangalore Airport) is approximately 35-45 km from most South Bangalore locations (around 45-60 minutes by car depending on traffic)
- Major areas we serve: Whitefield, Indiranagar, Koramangala, HSR Layout, Electronic City, Basapura, JP Nagar, BTM Layout
- Bangalore Metro connectivity is available in many served areas

GENERAL INFORMATION:
- We provide properties for Rent, Lease, and Sale
- All our properties are verified and legally documented
- We offer property management, maintenance, and security services
- Flexible lease terms from 12 to 60 months available
- We assist with property registration and legal documentation
`;

    cacheTime = now;
    return cachedContext;
  } catch (error) {
    console.error('Error fetching RAG context:', error);
    return cachedContext || 'Bathala Enterprises is a premium real estate company in Bangalore.';
  }
}

const SYSTEM_PROMPT = `You are Bathala AI, the helpful assistant for Bathala Enterprises, a premium real estate company in Bangalore, India.

Your role:
1. Answer questions about properties, services, locations, and pricing
2. Help users find suitable properties based on their needs
3. Provide information about distances, travel times, and area details
4. Be friendly, professional, and helpful

Guidelines:
- Always respond in a conversational, helpful manner
- If asked about specific properties, provide accurate details from the data
- For travel time questions, estimate based on typical Bangalore traffic conditions
- If you don't have specific information, suggest contacting us directly
- Keep responses concise but informative (2-4 sentences typically)
- Use ₹ for currency, never $
- Always refer to prices with Indian number formatting (lakhs, crores if applicable)

Important:
- Never make up property details that aren't in the data
- If no properties match a query, suggest visiting our website or contacting us
- For complex inquiries, recommend filling out the contact form`;

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured', reply: 'I apologize, but I\'m not available right now. Please contact us directly or fill out our contact form.' },
        { status: 503 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limited', reply: 'You\'re sending too many messages. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string' || message.length > 1000) {
      return NextResponse.json(
        { error: 'Invalid message', reply: 'Please send a valid message.' },
        { status: 400 }
      );
    }

    // Get real-time context
    const ragContext = await getRAGContext();

    // Initialize model - using gemini-2.0-flash (current stable model)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build conversation history for context
    const conversationHistory = history.slice(-6).map((msg: { role: string; content: string }) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    // Create the prompt
    const fullPrompt = `${SYSTEM_PROMPT}

${ragContext}

${conversationHistory ? `Recent conversation:\n${conversationHistory}\n` : ''}
User: ${message}

Respond helpfully and concisely:`;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      reply: text.trim(),
      success: true
    });

  } catch (error: unknown) {
    console.error('Chat API error:', error);
    
    // Handle rate limit / quota errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      return NextResponse.json({
        reply: 'Our AI assistant is currently busy. Please try again in a few moments, or contact us directly at +91 98765 43210.',
        success: false
      });
    }
    
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      return NextResponse.json({
        reply: 'I\'m having trouble connecting right now. Please contact us directly at +91 98765 43210 or email us.',
        success: false
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response', 
        reply: 'I apologize, but I encountered an error. Please try again or contact us directly at +91 98765 43210.' 
      },
      { status: 500 }
    );
  }
}
