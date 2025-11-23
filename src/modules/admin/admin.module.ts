import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FirestoreModule } from '../firestore/firestore.module';
import { NhlApiModule } from '../nhl-api/nhl-api.module';


@Module({
  imports: [
    FirestoreModule,
    NhlApiModule

  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [],
})
export class AdminModule {}