'use client';

import {
  PieChart, Pie, Cell, Tooltip as PieTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend as LineLegend,
  BarChart, Bar, Tooltip as BarTooltip, Legend as BarLegend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#ffbb28', '#8dd1e1'];

type CategoryBreakdown = { category: string; total: number | string };
type MonthlyTrend = { month: string; income: number | string; expense: number | string };

type Analytics = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
};

type ChartsProps = { analytics: Analytics; role: string };

export default function Charts({ analytics, role }: ChartsProps) {
  if (!['read-only', 'user', 'admin'].includes(role)) {
    return <p className="text-gray-500">You don't have access to view analytics.</p>;
  }
  if (!analytics?.categoryBreakdown?.length) {
    return <p className="text-gray-500">No category data available to display charts.</p>;
  }

  // Normalize numbers coming from DB as strings
  const parsedCategoryData = analytics.categoryBreakdown.map((d) => ({
    category: d.category,
    total: parseFloat(d.total as string),
  }));
  const parsedMonthlyTrends = analytics.monthlyTrends.map((d) => ({
    month: d.month,
    income: parseFloat(d.income as string),
    expense: parseFloat(d.expense as string),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie / Donut */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Expense by Category</h2>
        <div className="w-full h-[350px] flex items-center justify-center overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={parsedCategoryData}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="70%"       // percent radius keeps it inside box
                labelLine={false}
                label={({ percent = 0 }) =>
                  percent < 0.05 ? '' : `${(percent * 100).toFixed(0)}%`
                }
              >
                {parsedCategoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <PieTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line - Monthly Trends */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Monthly Trends</h2>
        <div className="w-full h-[350px] flex items-center justify-center overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={parsedMonthlyTrends}
              // Extra padding so y-axis ticks & legend never clip
              margin={{ top: 20, right: 30, left: 50, bottom: 25 }}
            >
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <LineTooltip />
              <LineLegend />
              <Line type="monotone" dataKey="income" stroke="#82ca9d" name="Income" dot />
              <Line type="monotone" dataKey="expense" stroke="#ff8042" name="Expense" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar - Income vs Expense */}
      <div className="bg-white rounded shadow p-4 col-span-full">
        <h2 className="text-lg font-semibold mb-2">Income vs Expense</h2>
        <div className="w-full h-[320px] flex items-center justify-center overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  label: 'Current',
                  totalIncome: analytics.totalIncome,
                  totalExpense: analytics.totalExpense,
                },
              ]}
              // Give room for y ticks and legend
              margin={{ top: 20, right: 30, left: 50, bottom: 25 }}
            >
              <XAxis dataKey="label" />
              <YAxis />
              <Bar dataKey="totalIncome" fill="#82ca9d" name="Income" />
              <Bar dataKey="totalExpense" fill="#ff4d4f" name="Expense" />
              <BarTooltip />
              <BarLegend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
