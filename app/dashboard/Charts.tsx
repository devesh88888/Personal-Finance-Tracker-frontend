'use client';

import {
  PieChart, Pie, Cell, Tooltip as PieTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend as LineLegend,
  BarChart, Bar
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#ffbb28', '#8dd1e1'];

// Type definitions for analytics data
type CategoryBreakdown = {
  category: string;
  total: number;
};

type MonthlyTrend = {
  month: string;
  income: number;
  expense: number;
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
  if (role === 'read-only' || role === 'user' || role === 'admin') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart - Category Distribution */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Expense by Category</h2>
          <PieChart width={300} height={300}>
            <Pie
              data={analytics.categoryBreakdown}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {analytics.categoryBreakdown.map((_, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <PieTooltip />
          </PieChart>
        </div>

        {/* Line Chart - Monthly Trends */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Monthly Trends</h2>
          <LineChart
            width={400}
            height={300}
            data={analytics.monthlyTrends}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <XAxis dataKey="month" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <LineTooltip />
            <LineLegend />
            <Line type="monotone" dataKey="income" stroke="#82ca9d" />
            <Line type="monotone" dataKey="expense" stroke="#ff8042" />
          </LineChart>
        </div>

        {/* Bar Chart - Income vs Expense */}
        <div className="bg-white rounded shadow p-4 col-span-full">
          <h2 className="text-lg font-semibold mb-2">Income vs Expense</h2>
          <BarChart width={600} height={300} data={[analytics]}>
            <XAxis dataKey="label" hide />
            <YAxis />
            <Bar dataKey="totalIncome" fill="#82ca9d" name="Income" />
            <Bar dataKey="totalExpense" fill="#ff4d4f" name="Expense" />
            <LineTooltip />
            <LineLegend />
          </BarChart>
        </div>
      </div>
    );
  }

  return <p className="text-gray-500">You don't have access to view analytics.</p>;
}
