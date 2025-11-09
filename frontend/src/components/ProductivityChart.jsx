import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ProductivityChart = ({ tasks, meetings }) => {
  const [chartHeight, setChartHeight] = useState(350);

  useEffect(() => {
    const updateHeight = () => {
      setChartHeight(window.innerWidth <= 768 ? 300 : 350);
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  const chartData = useMemo(() => {
    return DAYS.map(day => {
      const dayTasks = tasks.filter(t => t.day === day);
      const dayMeetings = meetings.filter(m => m.day === day);
      
      const completedTasks = dayTasks.filter(t => t.completed).length;
      const completedMeetings = dayMeetings.filter(m => m.completed).length;
      const productivityScore = completedTasks * 2 + completedMeetings * 3;
      
      return {
        day: day.substring(0, 3), // Short form: Mon, Tue, etc.
        fullDay: day,
        tasksCompleted: completedTasks,
        meetingsCompleted: completedMeetings,
        productivityScore,
        totalTasks: dayTasks.length,
        totalMeetings: dayMeetings.length,
      };
    });
  }, [tasks, meetings]);

  const averageScore = useMemo(() => {
    const total = chartData.reduce((sum, day) => sum + day.productivityScore, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  const maxScore = useMemo(() => {
    return Math.max(...chartData.map(d => d.productivityScore));
  }, [chartData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-day">{data.fullDay}</p>
          <p className="tooltip-item">
            Tasks: <strong>{data.tasksCompleted}/{data.totalTasks}</strong>
          </p>
          <p className="tooltip-item">
            Meetings: <strong>{data.meetingsCompleted}/{data.totalMeetings}</strong>
          </p>
          <p className="tooltip-score">
            Score: <strong>{data.productivityScore}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="productivity-chart-card">
      <div className="chart-header">
        <div>
          <h2>📊 Productivity Insights</h2>
          <p className="chart-subtitle">Here's how productive you were this week</p>
        </div>
        <div className="productivity-score-display">
          <span className="score-label">Your Weekly Productivity</span>
          <span className="score-value">{averageScore}/100</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="day"
            stroke="#888"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#888"
            style={{ fontSize: '12px' }}
            label={{ value: 'Completed Items', angle: -90, position: 'insideLeft', style: { fill: '#888' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar
            dataKey="tasksCompleted"
            name="Tasks Completed"
            fill="#00BFA6"
            radius={[4, 4, 0, 0]}
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.productivityScore === maxScore ? '#00FFE5' : '#00BFA6'}
                opacity={entry.productivityScore === maxScore ? 1 : 0.8}
              />
            ))}
          </Bar>
          <Bar
            dataKey="meetingsCompleted"
            name="Meetings Completed"
            fill="#4A90E2"
            radius={[4, 4, 0, 0]}
            animationDuration={1200}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-meeting-${index}`}
                fill={entry.productivityScore === maxScore ? '#6BB6FF' : '#4A90E2'}
                opacity={entry.productivityScore === maxScore ? 1 : 0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProductivityChart;

