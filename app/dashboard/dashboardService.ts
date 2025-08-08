export const fetchAnalytics = async (token: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    console.error('Failed to fetch analytics');
    return null;
  }
  return await res.json();
};
