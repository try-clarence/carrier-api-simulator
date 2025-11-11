import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CarriersModule } from './carriers/carriers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CarriersModule,
  ],
})
export class AppModule {}
