const fs = require('fs');
const file = 'src/controllers/market.ts';
let code = fs.readFileSync(file, 'utf8');

// Add the import
if (!code.includes('redisPublisher')) {
    code = `import { redisPublisher } from '../redis/redis.js';\n` + code;
}

// Add the pubsub to STANDARD (Maker and Taker)
code = code.replace(`					// Ledger entries
					await tx.ledgerEntry.create({`, 
`					// Ledger entries
					await tx.ledgerEntry.create({`);

// Wait, I shouldn't use string replacement for this, it's too error prone.
