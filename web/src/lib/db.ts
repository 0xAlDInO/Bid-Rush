import { Pool } from 'pg';
import { config } from '@/config';

const pool = new Pool({
  connectionString: config.db.url,
});

export default pool;
