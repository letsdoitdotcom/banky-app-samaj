// Test script to debug admin login API
console.log('Testing admin login API...');

// Test 1: Direct API call with correct format
fetch('https://banky-app-samaj.vercel.app/api/auth/admin-login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://incomparable-macaron-eb6786.netlify.app'
  },
  body: JSON.stringify({
    email: 'admin@bankyapp.com',
    password: 'admin123'
  })
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});

// Test 2: Check if there are any issues with the data format
console.log('Test data:', {
  email: 'admin@bankyapp.com',
  password: 'admin123'
});

console.log('JSON stringified:', JSON.stringify({
  email: 'admin@bankyapp.com',
  password: 'admin123'
}));