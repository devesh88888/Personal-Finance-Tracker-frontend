'use client';

import {
  PieChart, Pie, Cell, Tooltip as PieTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend as LineLegend,
  BarChart, Bar, Tooltip as BarTooltip, Legend as BarLegend
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#ffbb28', '#8dd1e1'];

type CategoryBreakdown = {
  category: string;
  total: number | string;
};

type MonthlyTrend = {
  month: string;
  income: number | string;
  expense: number | string;
};

type Analytics = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
};

type ChartsProps = {
  analytics: Analytics;
  role: string;
};

export default function Charts({ analytics, role }: ChartsProps) {
  if (!['read-only', 'user', 'admin'].includes(role)) {
    return <p className="text-gray-500">You don't have access to view analytics.</p>;
  }

  if (!analytics || !analytics.categoryBreakdown || analytics.categoryBreakdown.length === 0) {
    return <p className="text-gray-500">No category data available to display charts.</p>;
  }

  const parsedCategoryData = analytics.categoryBreakdown.map(item => ({
    category: item.category,
    total: parseFloat(item.total as string),
  }));

  const parsedMonthlyTrends = analytics.monthlyTrends.map(item => ({
    month: item.month,
    income: parseFloat(item.income as string),
    expense: parseFloat(item.expense as string),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Expense by Category</h2>
        <div className="flex items-center justify-center h-[350px]">
          <PieChart width={350} height={350}>
            <Pie
              data={parsedCategoryData}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={70}
              labelLine={false}
              label={({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {parsedCategoryData.map((_, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <PieTooltip />
          </PieChart>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Monthly Trends</h2>
        <LineChart
          width={400}
          height={300}
          data={parsedMonthlyTrends}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <LineTooltip />
          <LineLegend />
          <Line type="monotone" dataKey="income" stroke="#82ca9d" name="Income" />
          <Line type="monotone" dataKey="expense" stroke="#ff8042" name="Expense" />
        </LineChart>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded shadow p-4 col-span-full">
        <h2 className="text-lg font-semibold mb-2">Income vs Expense</h2>
        <BarChart
          width={600}
          height={300}
          data={[{
            label: 'Current',
            totalIncome: analytics.totalIncome,
            totalExpense: analytics.totalExpense
          }]}
        >
          <XAxis dataKey="label" />
          <YAxis />
          <Bar dataKey="totalIncome" fill="#82ca9d" name="Income" />
          <Bar dataKey="totalExpense" fill="#ff4d4f" name="Expense" />
          <BarTooltip />
          <BarLegend />
        </BarChart>
      </div>
    </div>
  );
}
