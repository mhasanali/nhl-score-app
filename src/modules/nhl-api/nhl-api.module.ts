import { Module } from '@nestjs/common';
import { NhlApiService } from './nhl-api.service';

@Module({
  providers: [NhlApiService],
  exports: [NhlApiService],
})
export class NhlApiModule {}