import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { CatchStatistics, formatHourLabel } from '../../utils/statistics';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { useMemo } from 'react';

interface HourlyActivityChartProps {
  stats: CatchStatistics;
}

const CHART_HEIGHT = 180;

export default function HourlyActivityChart({ stats }: HourlyActivityChartProps) {
  const colors = useColors();
  const font = useFont(null, 10);
  const { state, isActive } = useChartPressState({ x: 0, y: { count: 0 } });

  // Prepare chart data - group into 4-hour blocks for cleaner display
  const chartData = useMemo(() => {
    const blocks = [
      { label: '12-4 AM', hours: [0, 1, 2, 3] },
      { label: '4-8 AM', hours: [4, 5, 6, 7] },
      { label: '8-12 PM', hours: [8, 9, 10, 11] },
      { label: '12-4 PM', hours: [12, 13, 14, 15] },
      { label: '4-8 PM', hours: [16, 17, 18, 19] },
      { label: '8-12 AM', hours: [20, 21, 22, 23] },
    ];

    return blocks.map((block, index) => {
      const count = block.hours.reduce((sum, hour) => {
        const hourData = stats.catchesByHour.find((h) => h.hour === hour);
        return sum + (hourData?.count || 0);
      }, 0);
      return {
        x: index,
        label: block.label,
        count,
      };
    });
  }, [stats.catchesByHour]);

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  if (stats.totalCatches === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No activity data available
        </Text>
      </View>
    );
  }

  // Find peak hours
  const peakBlock = chartData.reduce((max, d) => (d.count > max.count ? d : max), chartData[0]);

  return (
    <View style={styles.container}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['count']}
        domainPadding={{ left: 20, right: 20, top: 20, bottom: 10 }}
        axisOptions={{
          font,
          tickCount: { x: 6, y: 4 },
          formatYLabel: (value) => Math.round(value).toString(),
          formatXLabel: (value) => chartData[Math.round(value)]?.label?.split(' ')[0] || '',
          labelColor: colors.textSecondary,
          lineColor: colors.border,
        }}
        chartPressState={state}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.count}
            chartBounds={chartBounds}
            color={colors.primary}
            roundedCorners={{ topLeft: 4, topRight: 4 }}
            barWidth={30}
          />
        )}
      </CartesianChart>

      {/* Peak time indicator */}
      <View style={styles.peakContainer}>
        <Text style={[styles.peakLabel, { color: colors.textSecondary }]}>Peak fishing time:</Text>
        <Text style={[styles.peakValue, { color: colors.primary }]}>
          {peakBlock.label} ({peakBlock.count} catches)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CHART_HEIGHT + 40,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  peakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  peakLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  peakValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
