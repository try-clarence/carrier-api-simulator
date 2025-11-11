import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDataService } from './mock-data.service';
import { QuoteRequestDto } from '../dto/quote-request.dto';
import * as crypto from 'crypto';

@Injectable()
export class QuoteService {
  private quotes = new Map<string, any>();
  private quoteCache = new Map<string, any>(); // Cache for identical requests

  constructor(private mockDataService: MockDataService) {}

  async generateQuote(carrierId: string, quoteRequest: QuoteRequestDto) {
    const carrierConfig = this.mockDataService.getCarrierConfig(carrierId);

    if (!carrierConfig) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'CARRIER_NOT_FOUND',
          message: `Carrier '${carrierId}' not found`,
        },
      });
    }

    // Generate cache key from request
    const cacheKey = this.generateCacheKey(carrierId, quoteRequest);

    // Check if we have a cached quote for this exact request
    const cachedQuote = this.quoteCache.get(cacheKey);
    if (cachedQuote) {
      console.log(`✅ Cache HIT for key: ${cacheKey.substring(0, 16)}...`);
      return {
        ...cachedQuote,
        cached: true, // Indicate this is a cached response
        cache_key: cacheKey.substring(0, 16), // Show partial key for debugging
      };
    }

    console.log(`❌ Cache MISS for key: ${cacheKey.substring(0, 16)}... - Generating new quote`);

    const carrierQuoteId = this.mockDataService.generateQuoteId(carrierId, 'main');
    const timestamp = new Date().toISOString();
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Generate quotes for each coverage request
    const quotes = quoteRequest.coverage_requests.map((coverageRequest) => {
      const quoteId = this.mockDataService.generateQuoteId(
        carrierId,
        coverageRequest.coverage_type,
        cacheKey, // Use cache key as seed for deterministic IDs
      );

      const basePremium = this.mockDataService.calculateBasePremium(
        coverageRequest.coverage_type,
        coverageRequest.requested_limits,
        quoteRequest.business_info,
        quoteRequest.personal_info,
        cacheKey, // Use cache key as seed for deterministic pricing
      );

      const annualPremium = Math.round(basePremium * carrierConfig.pricingMultiplier);
      const monthlyPremium = Math.round(annualPremium / 12);
      const quarterlyPremium = Math.round(annualPremium / 4);

      // Determine if quote is approved
      const isApproved = Math.random() < carrierConfig.approvalRate;

      const expirationDate = new Date(coverageRequest.effective_date);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      // Handle both requested_deductible (singular) and requested_deductibles (plural for auto)
      const deductible = coverageRequest.requested_deductibles
        ? coverageRequest.requested_deductibles
        : coverageRequest.requested_deductible;

      const quote = {
        quote_id: quoteId,
        coverage_type: coverageRequest.coverage_type,
        status: isApproved ? 'quoted' : 'declined',
        coverage_limits: coverageRequest.requested_limits,
        premium: {
          annual: annualPremium,
          monthly: monthlyPremium,
          quarterly: quarterlyPremium,
          payment_in_full_discount: Math.round(annualPremium * 0.05),
        },
        deductible: deductible,
        effective_date: coverageRequest.effective_date,
        expiration_date: expirationDate.toISOString().split('T')[0],
        policy_form: this.getPolicyForm(coverageRequest.coverage_type),
        highlights: this.mockDataService.generateHighlights(coverageRequest.coverage_type),
        exclusions: this.mockDataService.generateExclusions(coverageRequest.coverage_type),
        optional_coverages: this.mockDataService.generateOptionalCoverages(
          coverageRequest.coverage_type,
        ),
        underwriting_notes: this.mockDataService.generateUnderwritingNotes(
          coverageRequest.coverage_type,
          quoteRequest.business_info,
          quoteRequest.personal_info,
        ),
      };

      if (!isApproved) {
        quote['decline_reason'] = this.getDeclineReason(
          coverageRequest.coverage_type,
          carrierConfig.name,
        );
        quote['decline_code'] = 'OUTSIDE_APPETITE';
      }

      return quote;
    });

    // Calculate package discount if multiple coverages
    let packageDiscount = null;
    if (quotes.length > 1 && quotes.every((q) => q.status === 'quoted')) {
      const totalPremium = quotes.reduce((sum, q) => sum + q.premium.annual, 0);
      const discountPercentage = 5;
      const discountAmount = Math.round(totalPremium * (discountPercentage / 100));

      packageDiscount = {
        available: true,
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        description: 'Multi-coverage package discount',
        applied_to: 'all_coverages',
      };
    }

    const response = {
      success: true,
      carrier_id: carrierId,
      carrier_name: carrierConfig.name,
      carrier_quote_id: carrierQuoteId,
      requested_quote_id: quoteRequest.quote_request_id,
      timestamp,
      valid_until: validUntil,
      cached: false, // This is a fresh quote
      quotes,
      package_discount: packageDiscount,
      underwriting_summary: {
        overall_risk_rating: 'preferred',
        approval_likelihood: 'high',
        notes: [
          `${carrierConfig.name} standard underwriting`,
          'All requested coverages reviewed',
          'Competitive pricing applied',
        ],
      },
      bind_eligibility: 'eligible_immediate',
      next_steps: [
        'Review quotes and select coverages',
        'Proceed to bind endpoint to purchase',
        `Quotes valid until ${validUntil.split('T')[0]}`,
      ],
    };

    // Store in cache for future identical requests
    this.quoteCache.set(cacheKey, response);
    console.log(`💾 Stored in cache with key: ${cacheKey.substring(0, 16)}...`);

    // Store quote for later retrieval by ID
    this.quotes.set(carrierQuoteId, {
      ...response,
      quoteRequest,
      createdAt: timestamp,
    });

    quotes.forEach((quote) => {
      this.quotes.set(quote.quote_id, {
        ...response,
        selectedQuote: quote,
        quoteRequest,
        createdAt: timestamp,
      });
    });

    return response;
  }

  /**
   * Generate a deterministic cache key from the quote request
   * Same request parameters = same cache key = same quote
   */
  private generateCacheKey(carrierId: string, quoteRequest: QuoteRequestDto): string {
    // Create a normalized object with only the fields that affect pricing
    const cacheData = {
      carrier_id: carrierId,
      insurance_type: quoteRequest.insurance_type,

      // For personal insurance
      personal_info: quoteRequest.personal_info
        ? {
            occupation: quoteRequest.personal_info.occupation,
            credit_score_tier: quoteRequest.personal_info.credit_score_tier,
            state: quoteRequest.personal_info.address?.state,
            zip: quoteRequest.personal_info.address?.zip,
          }
        : null,

      // For commercial insurance
      business_info: quoteRequest.business_info
        ? {
            industry: quoteRequest.business_info.industry,
            industry_code: quoteRequest.business_info.industry_code,
            annual_revenue: quoteRequest.business_info.financial_info?.annual_revenue,
            employees: quoteRequest.business_info.financial_info?.full_time_employees,
            state: quoteRequest.business_info.address?.state,
            zip: quoteRequest.business_info.address?.zip,
          }
        : null,

      // Coverage requests (the most important part)
      coverage_requests: quoteRequest.coverage_requests.map((cr) => ({
        coverage_type: cr.coverage_type,
        requested_limits: cr.requested_limits,
        requested_deductible: cr.requested_deductible,
        effective_date: cr.effective_date,
        // Include property info for homeowners
        dwelling_value: cr.property_info?.dwelling_value,
        year_built: cr.property_info?.year_built,
        construction_type: cr.property_info?.construction_type,
        // Include vehicle info for auto
        vehicle_year: cr.vehicle_info?.year,
        vehicle_make: cr.vehicle_info?.make,
        vehicle_model: cr.vehicle_info?.model,
        // Include cyber info
        has_cybersecurity: cr.cyber_info?.has_cybersecurity_policy,
        number_of_records: cr.cyber_info?.number_of_records,
      })),
    };

    // Create hash of normalized data
    const dataString = JSON.stringify(cacheData);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');

    return hash;
  }

  getQuote(quoteId: string) {
    const quote = this.quotes.get(quoteId);

    if (!quote) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Quote '${quoteId}' not found`,
        },
      });
    }

    return quote;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      total_cached_quotes: this.quoteCache.size,
      total_quotes_by_id: this.quotes.size,
      cache_keys: Array.from(this.quoteCache.keys()).map((k) => k.substring(0, 16) + '...'),
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.quoteCache.clear();
    console.log('🗑️  Quote cache cleared');
  }

  private getPolicyForm(coverageType: string): string {
    const forms = {
      general_liability: 'ISO CGL',
      professional_liability: 'Claims-Made',
      cyber_liability: 'Cyber Pro Form',
      homeowners: 'HO-3',
      auto: 'Personal Auto Policy',
      renters: 'HO-4',
      life: 'Term Life',
    };

    return forms[coverageType] || 'Standard Form';
  }

  private getDeclineReason(coverageType: string, carrierName: string): string {
    return `${carrierName} has determined that this ${coverageType} coverage request is outside our current risk appetite. Please consider alternative carriers.`;
  }
}
