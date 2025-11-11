import { Module } from '@nestjs/common';
import { CarriersController } from './carriers.controller';
import { QuoteService } from './services/quote.service';
import { PolicyService } from './services/policy.service';
import { MockDataService } from './services/mock-data.service';

@Module({
  controllers: [CarriersController],
  providers: [QuoteService, PolicyService, MockDataService],
})
export class CarriersModule {}
