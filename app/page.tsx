// frontend/app/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('Loading...');

useEffect(() => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/`;
  console.log('🔍 Fetching from:', url);

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    })
    .then((data) => setMessage(data.message))
    .catch((err) => {
      console.error('❌ Fetch error:', err);
      setMessage('❌ Failed to connect to backend');
    });
}, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-purple-700">💰 Personal Finance Tracker</h1>
      <p className="text-lg">{message}</p>
    </main>
  );
}
