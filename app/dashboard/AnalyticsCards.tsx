interface Props {
  analytics: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

export default function AnalyticsCards({ analytics }: Props) {
  const cardStyle = "p-4 bg-white rounded shadow text-center";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className={cardStyle}>
        <h3 className="text-gray-600">Total Income</h3>
        <p className="text-green-600 font-bold text-xl">₹{analytics.totalIncome}</p>
      </div>
      <div className={cardStyle}>
        <h3 className="text-gray-600">Total Expense</h3>
        <p className="text-red-600 font-bold text-xl">₹{analytics.totalExpense}</p>
      </div>
      <div className={cardStyle}>
        <h3 className="text-gray-600">Balance</h3>
        <p className={`font-bold text-xl ${analytics.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ₹{analytics.balance}
        </p>
      </div>
    </div>
  );
}
