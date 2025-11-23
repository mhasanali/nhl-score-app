import { Injectable, Logger } from '@nestjs/common';
import { NhlApiService } from '../nhl-api/nhl-api.service';
import { FirestoreService } from '../firestore/firestore.service';

/**
 * Pub/Sub Service
 * 
 * Orchestrates the NHL scores fetch workflow:
 * 1. Fetch games from NHL API
 * 2. Store in Firestore
 * 3. Handle errors
 * 
 * This is the main business logic triggered by Pub/Sub
 */
@Injectable()
export class PubSubService {
  private readonly logger = new Logger(PubSubService.name);

  constructor(
    private readonly nhlApiService: NhlApiService,
    private readonly firestoreService: FirestoreService,
  ) {}


  async fetchAndStoreNhlScores(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('Starting NHL scores fetch job');

    try {
      this.logger.log('Fetching games from NHL API');
      // 7 days for now
      const games = await this.nhlApiService.fetchRecentGames(7);

      if (!games || games.length === 0) {
        this.logger.warn('No games found for the date range');
        return;
      }

      this.logger.log(`Fetched ${games.length} games from API`);

      this.logger.log('Storing games in Firestore...');
      await this.firestoreService.storeGames(games);

      // For benchmarking - data could be huge
      const duration = Date.now() - startTime;
      this.logger.log(`Job completed successfully in ${duration}ms`);
      this.logger.log(`Stats: ${games.length} games processed`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Job failed after ${duration}ms: ${error.message}`);
      this.logger.error(error.stack);

      throw error;
    }
  }

}