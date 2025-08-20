import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import { Domain, User } from '@/models';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schema for domain creation
const createDomainSchema = z.object({
  domain: z.string()
    .min(1, 'Domain is required')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/, 'Invalid domain format')
    .transform(domain => domain.toLowerCase()),
});

// GET /api/domains - Get user's domains
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('GET /api/domains - Session:', session);
    if (!session?.user?.email) {
      console.log('GET /api/domains - No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const domains = await Domain.find({ 
      userId: user._id,
      isActive: true 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/domains - Create a new domain
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('POST /api/domains - Session:', session);
    if (!session?.user?.email) {
      console.log('POST /api/domains - No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDomainSchema.parse(body);

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if domain already exists
    const existingDomain = await Domain.findOne({ domain: validatedData.domain });
    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new domain
    const domain = new Domain({
      userId: user._id,
      domain: validatedData.domain,
      verificationToken,
      cnameTarget: process.env.CUSTOM_DOMAIN_TARGET || 'custom.broslunas.link',
    });

    await domain.save();

    return NextResponse.json({
      message: 'Domain created successfully',
      domain: {
        id: domain._id,
        domain: domain.domain,
        isVerified: domain.isVerified,
        isActive: domain.isActive,
        cnameTarget: domain.cnameTarget,
        verificationToken: domain.verificationToken,
        createdAt: domain.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}