import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { privyDid, recipientAddress, amountSol, txSignature } = await request.json();

    if (!privyDid || !recipientAddress || !amountSol) {
      return NextResponse.json(
        { error: 'privyDid, recipientAddress, and amountSol are required' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO withdrawals (privy_did, recipient_address, amount_sol, tx_signature, status)
      VALUES ($1, $2, $3, $4, 'completed')
      RETURNING *;
    `;

    const values = [privyDid, recipientAddress, amountSol, txSignature || null];
    const res = await pool.query(query, values);

    return NextResponse.json({ success: true, withdrawal: res.rows[0] });
  } catch (error: any) {
    console.error('Database Error (Withdrawal):', error);
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
    const res = await pool.query(
      'SELECT * FROM withdrawals WHERE privy_did = $1 ORDER BY created_at DESC LIMIT 20',
      [privyDid]
    );
    return NextResponse.json({ withdrawals: res.rows });
  } catch (error: any) {
    console.error('Database Error (Withdrawals List):', error);
    return NextResponse.json({ withdrawals: [], mock: true });
  }
}
