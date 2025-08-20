import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import { Domain, User } from '@/models';
import mongoose from 'mongoose';
import dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);
const resolveA = promisify(dns.resolve4);

// POST /api/domains/[id]/verify - Verify domain DNS configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid domain ID' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const domain = await Domain.findOne({
      _id: params.id,
      userId: user._id,
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Update last verification attempt
    domain.lastVerificationAttempt = new Date();
    await domain.save();

    try {
      // Check CNAME record
      let isValidCname = false;
      let cnameRecords: string[] = [];
      
      try {
        cnameRecords = await resolveCname(domain.domain);
        isValidCname = cnameRecords.some(record => 
          record.toLowerCase() === domain.cnameTarget.toLowerCase()
        );
      } catch (cnameError) {
        // If CNAME fails, try A record as fallback
        try {
          const aRecords = await resolveA(domain.cnameTarget);
          const domainARecords = await resolveA(domain.domain);
          
          // Check if domain points to the same IP as our target
          isValidCname = aRecords.some(targetIp => 
            domainARecords.includes(targetIp)
          );
        } catch (aError) {
          console.error('DNS resolution failed for both CNAME and A records:', {
            domain: domain.domain,
            cnameError: cnameError instanceof Error ? cnameError.message : String(cnameError),
            aError: aError instanceof Error ? aError.message : String(aError)
          });
        }
      }

      if (isValidCname) {
        // Domain is verified
        domain.isVerified = true;
        domain.verifiedAt = new Date();
        await domain.save();

        return NextResponse.json({
          message: 'Domain verified successfully',
          domain: {
            id: domain._id,
            domain: domain.domain,
            isVerified: domain.isVerified,
            verifiedAt: domain.verifiedAt,
            cnameRecords,
          },
        });
      } else {
        return NextResponse.json({
          error: 'Domain verification failed',
          message: `CNAME record not found or incorrect. Please ensure ${domain.domain} has a CNAME record pointing to ${domain.cnameTarget}`,
          details: {
            domain: domain.domain,
            expectedTarget: domain.cnameTarget,
            foundRecords: cnameRecords,
          },
        }, { status: 400 });
      }
    } catch (dnsError) {
      console.error('DNS verification error:', dnsError);
      return NextResponse.json({
        error: 'DNS verification failed',
        message: 'Unable to resolve DNS records for the domain',
        details: {
          domain: domain.domain,
          error: dnsError instanceof Error ? dnsError.message : 'Unknown DNS error',
        },
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/domains/[id]/verify - Get verification status and instructions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid domain ID' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const domain = await Domain.findOne({
      _id: params.id,
      userId: user._id,
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({
      domain: {
        id: domain._id,
        domain: domain.domain,
        isVerified: domain.isVerified,
        cnameTarget: domain.cnameTarget,
        verificationToken: domain.verificationToken,
        lastVerificationAttempt: domain.lastVerificationAttempt,
        verifiedAt: domain.verifiedAt,
      },
      instructions: {
        step1: `Add a CNAME record for ${domain.domain}`,
        step2: `Point it to: ${domain.cnameTarget}`,
        step3: 'Wait for DNS propagation (can take up to 48 hours)',
        step4: 'Click "Verify Domain" to check the configuration',
      },
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}