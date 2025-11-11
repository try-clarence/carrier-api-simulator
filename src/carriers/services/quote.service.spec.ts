import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { MockDataService } from './mock-data.service';

describe('QuoteService', () => {
  let service: QuoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuoteService, MockDataService],
    }).compile();

    service = module.get<QuoteService>(QuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQuote', () => {
    const validQuoteRequest = {
      quote_request_id: 'test_001',
      insurance_type: 'commercial' as const,
      business_info: {
        legal_name: 'Test Company LLC',
        industry: 'Technology',
        industry_code: '541512',
        year_started: 2020,
        address: {
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
        financial_info: {
          annual_revenue: 500000,
          full_time_employees: 5,
        },
      },
      coverage_requests: [
        {
          coverage_type: 'general_liability',
          requested_limits: {
            per_occurrence: 1000000,
            general_aggregate: 2000000,
          },
          requested_deductible: 500,
          effective_date: '2025-12-01',
        },
      ],
    };

    it('should generate a quote for valid request', async () => {
      const result = await service.generateQuote('reliable_insurance', validQuoteRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.carrier_id).toBe('reliable_insurance');
      expect(result.quotes).toBeDefined();
      expect(result.quotes.length).toBeGreaterThan(0);
      expect(result.cached).toBe(false); // First time
    });

    it('should return cached quote for identical request', async () => {
      // First request
      const result1 = await service.generateQuote('reliable_insurance', validQuoteRequest);
      expect(result1.cached).toBe(false);

      // Second identical request
      const result2 = await service.generateQuote('reliable_insurance', validQuoteRequest);
      expect(result2.cached).toBe(true);
      expect(result2.cache_key).toBeDefined();

      // Quotes should be identical
      expect(result1.quotes[0].quote_id).toBe(result2.quotes[0].quote_id);
      expect(result1.quotes[0].premium.annual).toBe(result2.quotes[0].premium.annual);
    });

    it('should generate different quotes for different requests', async () => {
      const result1 = await service.generateQuote('reliable_insurance', validQuoteRequest);

      const differentRequest = {
        ...validQuoteRequest,
        business_info: {
          ...validQuoteRequest.business_info,
          financial_info: {
            annual_revenue: 1000000, // Different revenue
            full_time_employees: 10,
          },
        },
      };

      const result2 = await service.generateQuote('reliable_insurance', differentRequest);

      // Should both be fresh (not cached from each other)
      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(false);

      // Quote IDs should be different
      expect(result1.quotes[0].quote_id).not.toBe(result2.quotes[0].quote_id);
    });

    it('should throw NotFoundException for invalid carrier', async () => {
      await expect(service.generateQuote('invalid_carrier', validQuoteRequest)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include package discount for multiple coverages', async () => {
      const multiCoverageRequest = {
        ...validQuoteRequest,
        coverage_requests: [
          validQuoteRequest.coverage_requests[0],
          {
            coverage_type: 'professional_liability',
            requested_limits: {
              per_claim: 1000000,
              aggregate: 2000000,
            },
            requested_deductible: 5000,
            effective_date: '2025-12-01',
          },
        ],
      };

      const result = await service.generateQuote('reliable_insurance', multiCoverageRequest);

      expect(result.quotes.length).toBe(2);
      expect(result.package_discount).toBeDefined();
      if (result.package_discount) {
        expect(result.package_discount.available).toBe(true);
      }
    });
  });

  describe('getQuote', () => {
    it('should return quote by ID after generation', async () => {
      const quoteRequest = {
        quote_request_id: 'test_002',
        insurance_type: 'commercial' as const,
        business_info: {
          legal_name: 'Test Company',
          industry: 'Technology',
          industry_code: '541512',
          address: {
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
          financial_info: {
            annual_revenue: 500000,
            full_time_employees: 5,
          },
        },
        coverage_requests: [
          {
            coverage_type: 'general_liability',
            requested_limits: { per_occurrence: 1000000 },
            requested_deductible: 500,
            effective_date: '2025-12-01',
          },
        ],
      };

      const quote = await service.generateQuote('reliable_insurance', quoteRequest);
      const quoteId = quote.quotes[0].quote_id;

      const retrievedQuote = service.getQuote(quoteId);
      expect(retrievedQuote).toBeDefined();
    });

    it('should throw NotFoundException for invalid quote ID', () => {
      expect(() => service.getQuote('invalid-quote-id')).toThrow(NotFoundException);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = service.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.total_cached_quotes).toBeDefined();
      expect(stats.total_quotes_by_id).toBeDefined();
      expect(Array.isArray(stats.cache_keys)).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      const quoteRequest = {
        quote_request_id: 'test_003',
        insurance_type: 'commercial' as const,
        business_info: {
          legal_name: 'Test Company',
          industry: 'Technology',
          industry_code: '541512',
          address: {
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
          financial_info: {
            annual_revenue: 500000,
            full_time_employees: 5,
          },
        },
        coverage_requests: [
          {
            coverage_type: 'general_liability',
            requested_limits: { per_occurrence: 1000000 },
            requested_deductible: 500,
            effective_date: '2025-12-01',
          },
        ],
      };

      // Generate quote (will be cached)
      await service.generateQuote('reliable_insurance', quoteRequest);

      // Clear cache
      service.clearCache();

      // Check stats
      const stats = service.getCacheStats();
      expect(stats.total_cached_quotes).toBe(0);

      // Generate same request again - should not be cached
      const result = await service.generateQuote('reliable_insurance', quoteRequest);
      expect(result.cached).toBe(false);
    });
  });
});
