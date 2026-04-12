// Quick test to check POS API response
const token = 'your-pos-token-here'; // You'll need to replace this with a real token

fetch('/api/pos/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('POS Products Response:');
  if (data.products && data.products.length > 0) {
    const product = data.products.find(p => p.name === 'hehe');
    if (product) {
      console.log('Product "hehe":');
      console.log(JSON.stringify(product, null, 2));
      if (product.productVariants) {
        console.log('\nVariants:');
        product.productVariants.forEach(v => {
          console.log(`  - ${v.name}: price=${v.price}, id=${v.id}`);
        });
      }
    }
  }
})
.catch(err => console.error('Error:', err));
