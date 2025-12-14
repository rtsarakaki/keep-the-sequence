import { SQSEvent, SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = (event: SQSEvent) => {
  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body) as unknown;
      
      // TODO: Process game event
      // - Save to gameEvents table
      // - Send to analytics
      // - Handle critical events
      
      console.log('Processing event:', messageBody);
    } catch (error) {
      console.error('Error processing SQS message:', error);
      // Message will be retried or sent to DLQ
      throw error;
    }
  }
  return Promise.resolve();
};

