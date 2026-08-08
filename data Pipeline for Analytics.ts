Data Pipeline for Analytics.ts
// lib/analytics/data-pipeline.ts
import { ClickHouse } from '@clickhouse/client';

// ClickHouse for analytics
const clickhouse = new ClickHouse({
  url: process.env.CLICKHOUSE_URL,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
});

// Real-time analytics streaming
export class AnalyticsPipeline {
  async trackEvent(event: {
    userId: string;
    eventType: string;
    properties: Record<string, any>;
    timestamp?: Date;
  }) {
    // Insert into ClickHouse
    await clickhouse.insert({
      table: 'events',
      values: [{
        user_id: event.userId,
        event_type: event.eventType,
        properties: JSON.stringify(event.properties),
        timestamp: event.timestamp || new Date(),
        date: new Date().toISOString().split('T')[0],
      }],
      format: 'JSONEachRow',
    });
    
    // Also send to Kafka for stream processing
    await eventBus.publish(EventType.ANALYTICS_TRACK, event);
  }
  
  // Generate reports
  async generateReport(userId: string, dateRange: { start: Date; end: Date }) {
    const query = `
      SELECT 
        event_type,
        count() as count,
        uniq(user_id) as unique_users,
        avg(JSONExtractFloat(properties, 'amount')) as avg_amount
      FROM events
      WHERE 
        user_id = {userId:UUID}
        AND date BETWEEN {startDate:Date} AND {endDate:Date}
      GROUP BY event_type
    `;
    
    const result = await clickhouse.query({
      query,
      format: 'JSONEachRow',
      query_params: {
        userId,
        startDate: dateRange.start,
        endDate: dateRange.end,
      },
    });
    
    return result.json();
  }
}