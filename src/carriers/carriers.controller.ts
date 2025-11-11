import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard } from './guards/api-key.guard';
import { QuoteService } from './services/quote.service';
import { PolicyService } from './services/policy.service';
import { QuoteRequestDto } from './dto/quote-request.dto';
import { BindRequestDto } from './dto/bind-request.dto';
import { RenewRequestDto } from './dto/renew-request.dto';
import { EndorseRequestDto } from './dto/endorse-request.dto';
import { CancelRequestDto } from './dto/cancel-request.dto';
import { CertificateRequestDto } from './dto/certificate-request.dto';

@Controller('carriers')
@UseGuards(ApiKeyGuard)
export class CarriersController {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly policyService: PolicyService,
  ) {}

  // 1. Quote Generation
  @Post(':carrier_id/quote')
  @HttpCode(HttpStatus.OK)
  async getQuote(@Param('carrier_id') carrierId: string, @Body() quoteRequest: QuoteRequestDto) {
    return await this.quoteService.generateQuote(carrierId, quoteRequest);
  }

  // 2. Policy Binding
  @Post(':carrier_id/bind')
  @HttpCode(HttpStatus.CREATED)
  async bindPolicy(@Param('carrier_id') carrierId: string, @Body() bindRequest: BindRequestDto) {
    return await this.policyService.bindPolicy(carrierId, bindRequest);
  }

  // 3. Policy Retrieval
  @Get(':carrier_id/policies/:policy_id')
  async getPolicy(@Param('carrier_id') carrierId: string, @Param('policy_id') policyId: string) {
    return await this.policyService.getPolicy(carrierId, policyId);
  }

  // 4. Policy Renewal
  @Post(':carrier_id/policies/:policy_id/renew')
  async renewPolicy(
    @Param('carrier_id') carrierId: string,
    @Param('policy_id') policyId: string,
    @Body() renewRequest: RenewRequestDto,
  ) {
    return await this.policyService.renewPolicy(carrierId, policyId, renewRequest);
  }

  // 5. Policy Endorsement
  @Post(':carrier_id/policies/:policy_id/endorse')
  async addEndorsement(
    @Param('carrier_id') carrierId: string,
    @Param('policy_id') policyId: string,
    @Body() endorseRequest: EndorseRequestDto,
  ) {
    return await this.policyService.addEndorsement(carrierId, policyId, endorseRequest);
  }

  // 6. Policy Cancellation
  @Post(':carrier_id/policies/:policy_id/cancel')
  async cancelPolicy(
    @Param('carrier_id') carrierId: string,
    @Param('policy_id') policyId: string,
    @Body() cancelRequest: CancelRequestDto,
  ) {
    return await this.policyService.cancelPolicy(carrierId, policyId, cancelRequest);
  }

  // 7. Certificate Generation
  @Post(':carrier_id/policies/:policy_id/certificate')
  async generateCertificate(
    @Param('carrier_id') carrierId: string,
    @Param('policy_id') policyId: string,
    @Body() certRequest: CertificateRequestDto,
  ) {
    return await this.policyService.generateCertificate(carrierId, policyId, certRequest);
  }

  // 8. Carrier Health Check
  @Get(':carrier_id/health')
  async checkHealth(@Param('carrier_id') carrierId: string) {
    const carrierConfigs = {
      reliable_insurance: 'Reliable Insurance Co.',
      techshield_underwriters: 'TechShield Underwriters',
      premier_underwriters: 'Premier Underwriters',
      fastbind_insurance: 'FastBind Insurance',
    };

    const carrierName = carrierConfigs[carrierId];

    if (!carrierName) {
      return {
        status: 'unknown',
        carrier_id: carrierId,
        message: 'Carrier not found',
      };
    }

    return {
      status: 'operational',
      carrier_id: carrierId,
      carrier_name: carrierName,
      timestamp: new Date().toISOString(),
      services: {
        quoting: 'operational',
        binding: 'operational',
        policy_management: 'operational',
        document_generation: 'operational',
      },
      supported_insurance_types: ['personal', 'commercial'],
      supported_coverages: {
        personal: ['homeowners', 'auto', 'renters', 'life', 'umbrella'],
        commercial: [
          'general_liability',
          'professional_liability',
          'cyber_liability',
          'workers_comp',
          'commercial_property',
          'business_auto',
          'umbrella',
          'directors_officers',
          'employment_practices',
          'crime',
          'media',
          'fiduciary',
          'employee_benefits',
        ],
      },
    };
  }

  // 9. Cache Statistics (For Testing/Debugging)
  @Get('cache/stats')
  async getCacheStats() {
    return {
      success: true,
      stats: this.quoteService.getCacheStats(),
      timestamp: new Date().toISOString(),
    };
  }

  // 10. Clear Cache (For Testing)
  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    this.quoteService.clearCache();
    return {
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
