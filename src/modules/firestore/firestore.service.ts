import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { initializeFirebase } from '../../common/config/firebase';
import { Game } from '../../common/interfaces/game.interface';
import { NhlApiService } from '../nhl-api/nhl-api.service';
import { Constants } from '../../common/constant';


@Injectable()
export class FirestoreService implements OnModuleInit {
  private readonly logger = new Logger(FirestoreService.name);
  private firestore: Firestore;

  constructor(
    private readonly nhlApiService: NhlApiService,
  ) {}

    onModuleInit() {
    this.firestore = initializeFirebase();
  }

    async storeGames(games: Game[]): Promise<void> {
    if (!games || games.length === 0) {
      this.logger.warn('No games to store');
      return;
    }

    this.logger.log(`Storing ${games.length} games`);

    try {
      // Check for schema changes (using first game as sample)
      await this.detectSchemaChanges(games[0]);

      // Store in batches
      await this.storeBatch(games);

      this.logger.log(`Successfully stored ${games.length} games`);
    } catch (error) {
      this.logger.error(`Failed to store games: ${error.message}`);
      throw error;
    }
  }


    private async storeBatch(games: Game[]): Promise<void> {
    const batchSize = Constants.BATCH_SIZE;

    for (let i = 0; i < games.length; i += batchSize) {
      const batch = this.firestore.batch();
      // crates batch of games
      const chunk = games.slice(i, i + batchSize);

      chunk.forEach((game) => {
        // for IDEMPOTENCY -> lets use gameId
        const docRef = this.firestore.collection('games').doc(game.gameId);

        batch.set(docRef, game, { merge: true });
      });
    
      await batch.commit();
      this.logger.log(`Stored batch ${i / batchSize + 1} (${chunk.length} games)`);
    }
  }

    private async detectSchemaChanges(sampleGame: Game): Promise<void> {
    try {
        // fetching doc
      const schemaRef = this.firestore.collection('_metadata').doc('schema');
      const schemaDoc = await schemaRef.get();

      // Extract all field paths from the game
      const newFields = this.extractFieldPaths(sampleGame);

      // Check if any new fields in the firestore
      const knownFields: string[] = schemaDoc.exists
        ? (schemaDoc.data()?.knownFields || [])
        : [];

      // Filtering new fields
      const unknownFields = newFields.filter((f) => !knownFields.includes(f));

      if (unknownFields.length > 0) {
        this.logger.warn(`Schema change detected! New fields: ${unknownFields.join(', ')}`);

        // Updating
        await schemaRef.set(
          {
            knownFields: [...knownFields, ...unknownFields],
            lastUpdated: new Date().toISOString(),
            newFieldsDetected: unknownFields,
          },
          { merge: true },
        );

        // Trigger backfill
        // Lets make it async as we dont need to wait
        this.logger.log('Triggering backfill for last 30 days...');
        this.backFillData(30).catch((err) => {
          this.logger.error(`Backfill failed: ${err.message}`);
        });
      } else {
        this.logger.log('No schema changes detected');
      }
    } catch (error) {
      this.logger.error(`Schema detection error: ${error.message}`);
    }
  }

    private extractFieldPaths(obj: any, prefix = ''): string[] {
    const fields: string[] = [];

    if (obj === null || obj === undefined) {
      return fields;
    }

    if (Array.isArray(obj)) {
      fields.push(prefix);
      if (obj.length > 0 && typeof obj[0] === 'object') {
        fields.push(...this.extractFieldPaths(obj[0], `${prefix}[0]`));
      }
      return fields;
    }

    if (typeof obj === 'object') {
      for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          fields.push(...this.extractFieldPaths(obj[key], path));
        } else {
          fields.push(path);
        }
      }
    } else {
      fields.push(prefix);
    }

    return fields;
}

  private async backFillData(days: number): Promise<void> {
    try {
      this.logger.log('Starting to backfill');

      // Fetch last 30 days from NHL API
      const games = await this.nhlApiService.fetchRecentGames(7);


      // Store them (merge: true will update existing docs)
      await this.storeGames(games);

      this.logger.log(`Backfill completed: ${games.length} games updated`);
    } catch (error) {
      this.logger.error(`Backfill failed: ${error.message}`);
      throw error;
    }
  }
  async getTeamGames(teamId: number, limit: number = 5): Promise<Game[]> {
    try {
      const snapshot = await this.firestore
        .collection('games')
        .where('participatingTeamIds', 'array-contains', teamId)
        .orderBy('startTime', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as Game);
    } catch (error) {
      this.logger.error(`Failed to get team games: ${error.message}`);
      throw error;
    }
  }

  async getTodaysGames(): Promise<Game[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const snapshot = await this.firestore
        .collection('games')
        .where('startTime', '>=', `${today}T00:00:00Z`)
        .where('startTime', '<', `${today}T23:59:59Z`)
        .get();

      return snapshot.docs.map((doc) => doc.data() as Game);
    } catch (error) {
      this.logger.error(`Failed to get today's games: ${error.message}`);
      throw error;
    }
  }

}