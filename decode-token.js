const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// Test token from the logs
const testToken = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..zaJ_axPPKzmtqfTX.Cw7JHkXkmLyfHrr4YITudxTLzdU55bUXUl0mU0nq99zRuNFGRV9DCkT9sAc2M78g-zsSGqzkGiB1d1mR2k1Mk34FPZlqzxf2tvTXrOCOKZA2PTJe8G4XfB-EHEiL4VTmc3M2RSEUXR0bZKW36KFcQ1UOMJc1N0I5cpm7gxXgk-IVFS-zTQqUIH9uctNeeapN_Vfl0hRe8TnvkJA6ViYVUKfs8rXmVmKTExjpT7j51cnibHjo3vUO4Nj08VqyGA0qiTv4GUEa5xB3OUG9ezhfxC3Ww-6BGkpgPgn3di14Z5lBsQ_k2GwKfANnIUib5TKH-mbCjyzJ8EqgW9quNPEzce0AI0jTf8aIjQ.6gMCVWz6MJaCxcO8cJMV7g';

try {
  const decoded = jwt.verify(testToken, JWT_SECRET);
  console.log('Decoded token:', decoded);
} catch (error) {
  console.error('Token decode error:', error.message);
}