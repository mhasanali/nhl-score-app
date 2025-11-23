import { Module } from '@nestjs/common';
import { PubSubController } from './pubsub.controller';
import { PubSubService } from './pubsub.service';
import { NhlApiModule } from '../nhl-api/nhl-api.module';
import { FirestoreModule } from '../firestore/firestore.module';

@Module({
  imports: [
    NhlApiModule,    
    FirestoreModule,   
  ],
  controllers: [PubSubController],
  providers: [PubSubService],
  exports: [PubSubService],
})
export class PubSubModule {}