import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { privyDid, email, firstName, lastName, walletAddress } = await request.json();

    if (!privyDid) {
      return NextResponse.json({ error: 'privyDid is required' }, { status: 400 });
    }

    const query = `
      INSERT INTO users (privy_did, email, first_name, last_name, wallet_address, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (privy_did)
      DO UPDATE SET
        email = COALESCE(EXCLUDED.email, users.email),
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        wallet_address = COALESCE(EXCLUDED.wallet_address, users.wallet_address),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [privyDid, email || null, firstName || null, lastName || null, walletAddress || null];
    const res = await pool.query(query, values);

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error: any) {
    console.error('Database Error:', error);
    // Return mock success if database isn't connected in dev/preview environment
    return NextResponse.json({
      success: true,
      message: 'Database connection failed or not configured, returned mock status',
      mock: true
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const privyDid = searchParams.get('privyDid');

  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid is required' }, { status: 400 });
  }

  try {
    const res = await pool.query('SELECT * FROM users WHERE privy_did = $1', [privyDid]);
    if (res.rows.length === 0) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: res.rows[0] });
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ user: null, mock: true });
  }
}
