import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'student_name',
      'student_email',
      'project_title',
      'project_description',
      'supervisor_name',
    ];

    const missingFields = requiredFields.filter(field => !body[field]?.trim());
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Forward to your backend API
    // Replace with your actual backend URL
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';

    const response = await fetch(`${backendUrl}/api/submit-rapport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to submit rapport' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Submit rapport error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
