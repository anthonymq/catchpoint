import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { Catch } from '../../db/schema';
import { useMemo } from 'react';
import { CartesianChart, Line, Area } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';

interface CatchesByTimeChartProps {
  catches: Catch[];
}

const CHART_HEIGHT = 200;

export default function CatchesByTimeChart({ catches }: CatchesByTimeChartProps) {
  const colors = useColors();
  const font = useFont(null, 12);

  // Group catches by week using timestamp-based approach
  const chartData = useMemo(() => {
    if (catches.length === 0) return [];

    // Sort catches by date
    const sortedCatches = [...catches].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const firstDate = new Date(sortedCatches[0].createdAt);
    const lastDate = new Date(sortedCatches[sortedCatches.length - 1].createdAt);

    // Calculate number of weeks between first and last catch
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks = Math.ceil((lastDate.getTime() - firstDate.getTime()) / msPerWeek) + 1;

    // Initialize all weeks with 0
    const weekCounts: number[] = new Array(Math.min(totalWeeks, 52)).fill(0);

    // Count catches per week
    sortedCatches.forEach((c) => {
      const catchDate = new Date(c.createdAt);
      const weekIndex = Math.floor((catchDate.getTime() - firstDate.getTime()) / msPerWeek);
      if (weekIndex >= 0 && weekIndex < weekCounts.length) {
        weekCounts[weekIndex]++;
      }
    });

    // Take last 12 weeks for display
    const displayWeeks = weekCounts.slice(-12);

    return displayWeeks.map((count, index) => ({
      x: index,
      count,
    }));
  }, [catches]);

  if (catches.length === 0 || chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No data available
        </Text>
      </View>
    );
  }

  // Check if we have any non-zero data
  const hasData = chartData.some(d => d.count > 0);
  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No catches in this period
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['count']}
        domainPadding={{ left: 10, right: 10, top: 20, bottom: 10 }}
        axisOptions={{
          font,
          tickCount: { x: 4, y: 4 },
          formatYLabel: (value) => Math.round(value).toString(),
          formatXLabel: (value) => {
            // Show week labels
            const weekNum = Math.round(value) + 1;
            if (weekNum === 1 || weekNum === chartData.length) {
              return `W${weekNum}`;
            }
            return '';
          },
          labelColor: colors.textSecondary,
          lineColor: colors.border,
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <Area
              points={points.count}
              y0={chartBounds.bottom}
              color={colors.primary}
              opacity={0.2}
              curveType="natural"
            />
            <Line
              points={points.count}
              color={colors.primary}
              strokeWidth={3}
              curveType="natural"
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CHART_HEIGHT,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
