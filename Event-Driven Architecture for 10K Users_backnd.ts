 Event-Driven Architecture for 10K Users_backnd.ts 
// lib/events/event-bus.ts
import { EventEmitter } from 'events';
import { Kafka } from 'kafkajs';
import { logger } from '@/lib/logger';

// Event types
export enum EventType {
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_OVERDUE = 'invoice.overdue',
  REMINDER_SENT = 'reminder.sent',
  USER_SIGNED_UP = 'user.signed_up',
  PAYMENT_FAILED = 'payment.failed',
  REPORT_GENERATED = 'report.generated'
}

// Kafka configuration for event streaming
const kafka = new Kafka({
  clientId: 'invoice-reminder-app',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  ssl: true,
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME || '',
    password: process.env.KAFKA_PASSWORD || '',
  },
});

export class EventBus {
  private producer = kafka.producer();
  private consumer = kafka.consumer({ groupId: 'invoice-service' });
  
  async publish(event: EventType, data: any) {
    await this.producer.connect();
    
    await this.producer.send({
      topic: event,
      messages: [
        {
          key: data.userId || 'system',
          value: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
            correlationId: crypto.randomUUID(),
          }),
          headers: {
            'source': 'invoice-service',
            'version': '1.0.0',
          },
        },
      ],
    });
    
    logger.info(`Event published: ${event}`, { data });
  }
  
  async subscribe(event: EventType, handler: (data: any) => Promise<void>) {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: event, fromBeginning: false });
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value?.toString() || '{}');
          await handler(data);
          
          logger.info(`Event consumed: ${topic}`, { data });
        } catch (error) {
          logger.error(`Failed to process event: ${topic}`, { error });
          // Send to dead letter queue
        }
      },
    });
  }
}