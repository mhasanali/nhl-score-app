import { Module } from '@nestjs/common';
import { PubSubModule } from './modules/pubsub/pubsub.module';
import { AdminModule } from './modules/admin/admin.module';


@Module({
  imports: [
    PubSubModule,
    AdminModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}