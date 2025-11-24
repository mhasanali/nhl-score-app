import { Injectable, Logger } from "@nestjs/common";
import { FirestoreService } from "../firestore/firestore.service";
import { NhlApiService } from "../nhl-api/nhl-api.service";
import { getFirestore } from "firebase-admin/firestore";

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

async testFirestoreWrite(gameId: string, gameData: any): Promise<void> {
  const firestore = getFirestore();
    await firestore.collection('games').doc(gameId).set(gameData);
  
  this.logger.log(`Successfully wrote test game: ${gameId}`);
}

async cleanupTestGames(): Promise<number> {
  const firestore = getFirestore();
  
  const snapshot = await firestore
    .collection('games')
    .where('_testDocument', '==', true)
    .get();
  
  const batch = firestore.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  
  this.logger.log(`Deleted ${snapshot.size} test games`);
  return snapshot.size;
}

}
