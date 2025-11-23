import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PubSubService } from './pubsub.service';

@Controller('pubsub')
export class PubSubController {
  private readonly logger = new Logger(PubSubController.name);

  constructor(private readonly pubsubService: PubSubService) {}

  // API to process the message from gcloud
@Post('nhl-scores-fetch')
  @HttpCode(HttpStatus.OK) 
  async handleNhlScoresFetch(@Body() body: any) {
    this.logger.log('Received Pub/Sub message');

    try {
      if (!body.message) {
        // Should have custom wrappers
        throw new BadRequestException('Invalid Pub/Sub message: missing "message" field');
      }

      const messageData = body.message.data
        ? Buffer.from(body.message.data, 'base64').toString('utf-8')
        : '{}';

      let payload: any = {};
      try {
        payload = JSON.parse(messageData);
      } catch (e) {
        this.logger.warn(`Could not parse message data: ${messageData}`);
      }

      this.logger.log(`Message ID: ${body.message.messageId}`);
      this.logger.log(`Publish Time: ${body.message.publishTime}`);
      this.logger.log(`Payload: ${JSON.stringify(payload)}`);

      // Process the job
      await this.pubsubService.fetchAndStoreNhlScores();

      // MUST return 2xx for Pub/Sub to acknowledge message
      return {
        success: true,
        messageId: body.message.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error processing Pub/Sub message: ${error.message}`);
      this.logger.error(error.stack);

      // Decide whether to retry:
      // - Return 2xx = Pub/Sub acknowledges (no retry)
      // - Return 5xx = Pub/Sub retries

      if (this.isRetryableError(error)) {
        // Return 500 to trigger Pub/Sub retry
        throw error;
      } else {
        // Return 200 to acknowledge (don't retry)
        return {
          success: false,
          error: error.message,
          messageId: body.message?.messageId,
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

    private isRetryableError(error: any): boolean {
    // Network errors, timeouts → retry
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Firestore errors → retry
    if (error.message?.includes('Firestore')) {
      return true;
    }

    // Bad request, validation errors → don't retry
    if (error instanceof BadRequestException) {
      return false;
    }

    // Default: retry
    return true;
  }

    @Post('test')
  @HttpCode(HttpStatus.OK)
  async testEndpoint() {
    this.logger.log('Test endpoint called');
    // - Caution - it will save in the firestore!
    await this.pubsubService.fetchAndStoreNhlScores();
    return { success: true, message: 'Test completed' };
  }
}