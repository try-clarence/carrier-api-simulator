import { Test, TestingModule } from '@nestjs/testing';
import { MockDataService } from './mock-data.service';

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockDataService],
    }).compile();

    service = module.get<MockDataService>(MockDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCarrierConfig', () => {
    it('should return config for valid carrier', () => {
      const config = service.getCarrierConfig('reliable_insurance');
      expect(config).toBeDefined();
      expect(config.name).toBe('Reliable Insurance Co.');
      expect(config.prefix).toBe('RIC');
    });

    it('should return config for techshield', () => {
      const config = service.getCarrierConfig('techshield_underwriters');
      expect(config).toBeDefined();
      expect(config.name).toBe('TechShield Underwriters');
      expect(config.prefix).toBe('TSU');
    });

    it('should return undefined for invalid carrier', () => {
      const config = service.getCarrierConfig('invalid_carrier');
      expect(config).toBeUndefined();
    });
  });

  describe('generateQuoteId', () => {
    it('should generate quote ID with correct format', () => {
      const quoteId = service.generateQuoteId('reliable_insurance', 'general_liability');
      expect(quoteId).toMatch(/^RIC-Q-\d{4}-\d{6}-GL$/);
    });

    it('should generate quote ID for homeowners', () => {
      const quoteId = service.generateQuoteId('reliable_insurance', 'homeowners');
      expect(quoteId).toMatch(/^RIC-Q-\d{4}-\d{6}-HO$/);
    });

    it('should generate deterministic quote ID with seed', () => {
      const seed = 'test-seed-123';
      const quoteId1 = service.generateQuoteId('reliable_insurance', 'general_liability', seed);
      const quoteId2 = service.generateQuoteId('reliable_insurance', 'general_liability', seed);

      // Should be the same because of the seed
      expect(quoteId1).toBe(quoteId2);
    });
  });

  describe('generatePolicyId', () => {
    it('should generate policy ID with correct format', () => {
      const policyId = service.generatePolicyId('reliable_insurance');
      expect(policyId).toMatch(/^RIC-P-\d{4}-\d{6}$/);
    });
  });

  describe('generatePolicyNumber', () => {
    it('should generate policy number with correct format', () => {
      const policyNumber = service.generatePolicyNumber('reliable_insurance', 'general_liability');
      expect(policyNumber).toMatch(/^RIC-\d{4}-GL-\d{6}$/);
    });
  });

  describe('calculateBasePremium', () => {
    it('should calculate base premium for general liability', () => {
      const premium = service.calculateBasePremium(
        'general_liability',
        { occurrence: 1000000 },
        { financial_info: { annual_revenue: 500000 } },
        null,
      );
      expect(premium).toBeGreaterThan(0);
      expect(typeof premium).toBe('number');
    });

    it('should calculate base premium for homeowners', () => {
      const premium = service.calculateBasePremium('homeowners', { dwelling: 500000 }, null, {
        credit_score_tier: 'good',
      });
      expect(premium).toBeGreaterThan(0);
    });

    it('should return deterministic premium with seed', () => {
      const seed = 'test-seed-456';
      const premium1 = service.calculateBasePremium(
        'general_liability',
        { occurrence: 1000000 },
        null,
        null,
        seed,
      );
      const premium2 = service.calculateBasePremium(
        'general_liability',
        { occurrence: 1000000 },
        null,
        null,
        seed,
      );

      expect(premium1).toBe(premium2);
    });

    it('should adjust premium based on limits', () => {
      const lowLimit = service.calculateBasePremium(
        'general_liability',
        { occurrence: 500000 },
        null,
        null,
        'seed',
      );
      const highLimit = service.calculateBasePremium(
        'general_liability',
        { occurrence: 2000000 },
        null,
        null,
        'seed',
      );

      expect(highLimit).toBeGreaterThan(lowLimit);
    });
  });

  describe('generateHighlights', () => {
    it('should return highlights for general liability', () => {
      const highlights = service.generateHighlights('general_liability');
      expect(Array.isArray(highlights)).toBe(true);
      expect(highlights.length).toBeGreaterThan(0);
    });

    it('should return highlights for cyber liability', () => {
      const highlights = service.generateHighlights('cyber_liability');
      expect(Array.isArray(highlights)).toBe(true);
      expect(highlights.length).toBeGreaterThan(0);
    });
  });

  describe('generateExclusions', () => {
    it('should return exclusions for general liability', () => {
      const exclusions = service.generateExclusions('general_liability');
      expect(Array.isArray(exclusions)).toBe(true);
      expect(exclusions.length).toBeGreaterThan(0);
    });
  });
});
