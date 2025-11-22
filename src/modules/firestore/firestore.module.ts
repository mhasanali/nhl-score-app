import { Module } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { NhlApiModule } from '../nhl-api/nhl-api.module';

@Module({
  imports: [NhlApiModule],
  providers: [FirestoreService],
  exports: [FirestoreService],
})
export class FirestoreModule {}