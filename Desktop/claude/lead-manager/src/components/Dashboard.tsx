import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Calendar, Users, TrendingUp, Target, Filter, Download } from 'lucide-react';

interface DashboardMetrics {
  totalSubmissions: number;
  totalUsers: number;
  conversionRate: number;
  avgSubmissionsPerDay: number;
  topPerformingScript: string;
  recentActivity: Array<{
    date: string;
    submissions: number;
    users: number;
    conversionRate: number;
  }>;
  submissionsByScript: Array<{
    name: string;
    submissions: number;
    conversionRate: number;
  }>;
  submissionsByUser: Array<{
    name: string;
    submissions: number;
    role: string;
  }>;
  submissionsByHour: Array<{
    hour: string;
    submissions: number;
  }>;
}

interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  selectedUsers: string[];
  selectedScripts: string[];
  chartType: 'bar' | 'line' | 'area' | 'pie';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Dashboard() {
  const { user, role } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: subDays(new Date(), 30),
      end: new Date()
    },
    selectedUsers: [],
    selectedScripts: [],
    chartType: 'line'
  });

  // Mock data - in real implementation, this would come from your backend
  const mockMetrics: DashboardMetrics = useMemo(() => {
    const isAdmin = role?.id === 'admin';
    const isManager = role?.id === 'manager';
    const isAgent = role?.id === 'agent';

    // Generate mock data based on role
    const baseData = {
      totalSubmissions: isAdmin ? 1247 : isManager ? 523 : 89,
      totalUsers: isAdmin ? 25 : isManager ? 8 : 1,
      conversionRate: isAdmin ? 24.5 : isManager ? 28.2 : 31.0,
      avgSubmissionsPerDay: isAdmin ? 41.6 : isManager ? 17.4 : 3.0,
      topPerformingScript: 'Home Security Consultation',
      recentActivity: Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const multiplier = isAdmin ? 1 : isManager ? 0.4 : 0.08;
        return {
          date: format(date, 'MM/dd'),
          submissions: Math.floor(Math.random() * 50 * multiplier) + 5,
          users: Math.floor(Math.random() * (isAdmin ? 8 : isManager ? 3 : 1)) + 1,
          conversionRate: Math.random() * 20 + 15
        };
      }),
      submissionsByScript: [
        { name: 'Home Security', submissions: isAdmin ? 342 : isManager ? 145 : 25, conversionRate: 28.5 },
        { name: 'Pest Control', submissions: isAdmin ? 298 : isManager ? 126 : 21, conversionRate: 24.2 },
        { name: 'Solar Consultation', submissions: isAdmin ? 267 : isManager ? 113 : 19, conversionRate: 31.8 },
        { name: 'HVAC Service', submissions: isAdmin ? 205 : isManager ? 87 : 15, conversionRate: 22.1 },
        { name: 'Roofing Quote', submissions: isAdmin ? 135 : isManager ? 52 : 9, conversionRate: 26.4 }
      ],
      submissionsByUser: isAdmin ? [
        { name: 'John Smith', submissions: 156, role: 'Agent' },
        { name: 'Sarah Johnson', submissions: 143, role: 'Agent' },
        { name: 'Mike Wilson', submissions: 128, role: 'Agent' },
        { name: 'Emma Davis', submissions: 121, role: 'Agent' },
        { name: 'Alex Brown', submissions: 98, role: 'Agent' },
        { name: 'Lisa Garcia', submissions: 87, role: 'Manager' },
        { name: 'Tom Miller', submissions: 76, role: 'Manager' }
      ] : isManager ? [
        { name: 'John Smith', submissions: 156, role: 'Agent' },
        { name: 'Sarah Johnson', submissions: 143, role: 'Agent' },
        { name: 'Mike Wilson', submissions: 128, role: 'Agent' },
        { name: 'Emma Davis', submissions: 121, role: 'Agent' }
      ] : [
        { name: user?.firstName + ' ' + user?.lastName || 'You', submissions: 89, role: 'Agent' }
      ],
      submissionsByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i.toString().padStart(2, '0') + ':00',
        submissions: Math.floor(Math.random() * 20 * (isAdmin ? 1 : isManager ? 0.4 : 0.08)) + 1
      }))
    };

    return baseData;
  }, [role, user]);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setLoading(true);
      // In real implementation, fetch data from backend with role-based filtering
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMetrics(mockMetrics);
      setLoading(false);
    };

    loadData();
  }, [mockMetrics, filters]);

  const filteredData = useMemo(() => {
    if (!metrics) return null;

    // Filter data based on date range
    const filteredActivity = metrics.recentActivity.filter(activity => {
      const activityDate = new Date(activity.date + '/2025');
      return isWithinInterval(activityDate, {
        start: startOfDay(filters.dateRange.start),
        end: endOfDay(filters.dateRange.end)
      });
    });

    return {
      ...metrics,
      recentActivity: filteredActivity
    };
  }, [metrics, filters]);

  const renderChart = () => {
    if (!filteredData) return null;

    const chartData = filteredData.recentActivity;
    
    // If no data after filtering, return a message
    if (!chartData || chartData.length === 0) {
      return (
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#b3b3b3',
          fontSize: '16px'
        }}>
          No data available for the selected date range
        </div>
      );
    }

    switch (filters.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="submissions" fill="#0088FE" name="Submissions" />
              <Bar dataKey="users" fill="#00C49F" name="Active Users" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="submissions" stackId="1" stroke="#0088FE" fill="#0088FE" name="Submissions" />
              <Area type="monotone" dataKey="conversionRate" stackId="2" stroke="#FF8042" fill="#FF8042" name="Conversion Rate %" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredData.submissionsByScript}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="submissions"
              >
                {filteredData.submissionsByScript.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default: // line
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="submissions" stroke="#0088FE" strokeWidth={2} name="Submissions" />
              <Line type="monotone" dataKey="conversionRate" stroke="#FF8042" strokeWidth={2} name="Conversion Rate %" />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (!filteredData) {
    return <div className="dashboard-error">Failed to load dashboard data</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.firstName}! Here's your performance overview.</p>
      </div>

      {/* Filters */}
      <div className="dashboard-filters">
        <div className="filter-group">
          <label>
            <Calendar size={16} />
            Date Range
          </label>
          <input
            type="date"
            value={format(filters.dateRange.start, 'yyyy-MM-dd')}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, start: new Date(e.target.value) }
            }))}
          />
          <span>to</span>
          <input
            type="date"
            value={format(filters.dateRange.end, 'yyyy-MM-dd')}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, end: new Date(e.target.value) }
            }))}
          />
        </div>

        <div className="filter-group">
          <label>Chart Type</label>
          <select
            value={filters.chartType}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              chartType: e.target.value as any
            }))}
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="area">Area Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="dashboard-metrics">
        <div className="metric-card">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-content">
            <h3>{filteredData.totalSubmissions.toLocaleString()}</h3>
            <p>Total Submissions</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>{filteredData.totalUsers}</h3>
            <p>Active Users</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>{filteredData.conversionRate.toFixed(1)}%</h3>
            <p>Conversion Rate</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Calendar size={24} />
          </div>
          <div className="metric-content">
            <h3>{filteredData.avgSubmissionsPerDay.toFixed(1)}</h3>
            <p>Daily Average</p>
          </div>
        </div>
      </div>


      {/* Additional Charts */}
      <div className="dashboard-grid">
        {/* Submissions by Script */}
        <div className="dashboard-card">
          <h3>Top Performing Scripts</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filteredData.submissionsByScript} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="submissions" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Submissions by User (role-based) */}
        {role?.id !== 'agent' && (
          <div className="dashboard-card">
            <h3>{role?.id === 'admin' ? 'All Users Performance' : 'Team Performance'}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filteredData.submissionsByUser}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="submissions" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Hourly Activity */}
        <div className="dashboard-card">
          <h3>Activity by Hour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredData.submissionsByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="submissions" stroke="#FFBB28" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}