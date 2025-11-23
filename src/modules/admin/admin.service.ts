import { Injectable, Logger } from "@nestjs/common";
import { FirestoreService } from "../firestore/firestore.service";
import { NhlApiService } from "../nhl-api/nhl-api.service";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly nhlApiService: NhlApiService,
    private readonly firestoreService: FirestoreService,
  ) {}

    async backfillLast30Days(): Promise<void> {
    this.logger.log('Manual backfill triggered');

    try {
      const games = await this.nhlApiService.fetchLast30Days();
      await this.firestoreService.storeGames(games);

      this.logger.log(`Backfill completed: ${games.length} games`);
    } catch (error) {
      this.logger.error(`Backfill failed: ${error.message}`);
      throw error;
    }
  }

}
