import bcrypt from 'bcryptjs';

const plainPassword = 'admin123';
const hashedPassword = '$2b$10$kSvRxzjXmP8S/zKqZvZaFeXqJm1g8Ysv2x0L5nJ.Q5e.3mLQmQnzW';

async function test() {
  try {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Password match:', isValid);
    
    // Generate new hash
    const newHash = await bcrypt.hash(plainPassword, 10);
    console.log('New hash:', newHash);
    
    // Test new hash
    const isValid2 = await bcrypt.compare(plainPassword, newHash);
    console.log('New hash match:', isValid2);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
