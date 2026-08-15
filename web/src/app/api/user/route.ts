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
        email = COALESCE($2, users.email),
        first_name = COALESCE($3, users.first_name),
        last_name = COALESCE($4, users.last_name),
        wallet_address = COALESCE($5, users.wallet_address),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      privyDid,
      email !== undefined && email !== '' ? email : null,
      firstName !== undefined && firstName !== '' ? firstName : null,
      lastName !== undefined && lastName !== '' ? lastName : null,
      walletAddress !== undefined && walletAddress !== '' ? walletAddress : null
    ];

    const res = await pool.query(query, values);

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error: any) {
    console.error('Database Error:', error);
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
