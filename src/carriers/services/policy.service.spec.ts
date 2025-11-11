import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { QuoteService } from './quote.service';
import { MockDataService } from './mock-data.service';

describe('PolicyService', () => {
  let service: PolicyService;
  let quoteService: QuoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolicyService, QuoteService, MockDataService],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    quoteService = module.get<QuoteService>(QuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bindPolicy', () => {
    let quoteId: string;

    beforeEach(async () => {
      // Generate a quote first
      const quoteRequest = {
        quote_request_id: 'test_bind_001',
        insurance_type: 'commercial' as const,
        business_info: {
          legal_name: 'Test Company LLC',
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

      const quote = await quoteService.generateQuote('reliable_insurance', quoteRequest);
      quoteId = quote.quotes[0].quote_id;
    });

    it('should bind a policy from a valid quote', async () => {
      const bindRequest = {
        quote_id: quoteId,
        effective_date: '2025-12-01',
        payment_plan: 'annual' as const,
        payment_info: {
          method: 'credit_card',
          token: 'tok_test_123',
          billing_address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        insured_info: {
          primary_contact: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com',
            phone: '+15551234567',
          },
        },
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T10:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      const result = await service.bindPolicy('reliable_insurance', bindRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.policy.policy_id).toBeDefined();
      expect(result.policy.status).toBe('bound');
    });

    it('should throw NotFoundException for invalid quote ID', async () => {
      const bindRequest = {
        quote_id: 'invalid-quote-id',
        effective_date: '2025-12-01',
        payment_plan: 'annual' as const,
        payment_info: {
          method: 'credit_card',
          token: 'tok_test_123',
          billing_address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        insured_info: {
          primary_contact: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com',
            phone: '+15551234567',
          },
        },
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T10:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      await expect(service.bindPolicy('reliable_insurance', bindRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPolicy', () => {
    let policyId: string;

    beforeEach(async () => {
      // Create a policy
      const quoteRequest = {
        quote_request_id: 'test_get_001',
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

      const quote = await quoteService.generateQuote('reliable_insurance', quoteRequest);

      const bindRequest = {
        quote_id: quote.quotes[0].quote_id,
        effective_date: '2025-12-01',
        payment_plan: 'annual' as const,
        payment_info: {
          method: 'credit_card',
          token: 'tok_test',
          billing_address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        insured_info: {
          primary_contact: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com',
            phone: '+15551234567',
          },
        },
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T10:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      const policy = await service.bindPolicy('reliable_insurance', bindRequest);
      policyId = policy.policy.policy_id;
    });

    it('should retrieve policy by ID', async () => {
      const result = await service.getPolicy('reliable_insurance', policyId);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.policy.policy_id).toBe(policyId);
    });

    it('should throw NotFoundException for invalid policy ID', async () => {
      await expect(service.getPolicy('reliable_insurance', 'invalid-policy-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('renewPolicy', () => {
    let policyId: string;

    beforeEach(async () => {
      // Create a policy
      const quoteRequest = {
        quote_request_id: 'test_renew_001',
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

      const quote = await quoteService.generateQuote('reliable_insurance', quoteRequest);

      const bindRequest = {
        quote_id: quote.quotes[0].quote_id,
        effective_date: '2025-12-01',
        payment_plan: 'annual' as const,
        payment_info: {
          method: 'credit_card',
          token: 'tok_test',
          billing_address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        insured_info: {
          primary_contact: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com',
            phone: '+15551234567',
          },
        },
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T10:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      const policy = await service.bindPolicy('reliable_insurance', bindRequest);
      policyId = policy.policy.policy_id;
    });

    it('should generate renewal quote', async () => {
      const renewRequest = {
        renewal_type: 'standard' as const,
        desired_effective_date: '2026-12-01',
      };

      const result = await service.renewPolicy('reliable_insurance', policyId, renewRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.renewal_quote_id).toBeDefined();
      expect(result.renewal_status).toBe('quoted');
    });

    it('should throw NotFoundException for invalid policy ID', async () => {
      const renewRequest = {
        renewal_type: 'standard' as const,
        desired_effective_date: '2026-12-01',
      };

      await expect(
        service.renewPolicy('reliable_insurance', 'invalid-policy-id', renewRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addEndorsement', () => {
    let policyId: string;

    beforeEach(async () => {
      // Create a policy
      const quoteRequest = {
        quote_request_id: 'test_endorse_001',
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

      const quote = await quoteService.generateQuote('reliable_insurance', quoteRequest);

      const bindRequest = {
        quote_id: quote.quotes[0].quote_id,
        effective_date: '2025-12-01',
        payment_plan: 'annual' as const,
        payment_info: {
          method: 'credit_card',
          token: 'tok_test',
          billing_address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        insured_info: {
          primary_contact: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com',
            phone: '+15551234567',
          },
        },
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T10:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      const policy = await service.bindPolicy('reliable_insurance', bindRequest);
      policyId = policy.policy.policy_id;
    });

    it('should add endorsement to policy', async () => {
      const endorseRequest = {
        endorsement_type: 'increase_limits' as const,
        effective_date: '2025-12-15',
        details: {
          new_limits: {
            per_occurrence: 2000000,
          },
        },
      };

      const result = await service.addEndorsement('reliable_insurance', policyId, endorseRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.endorsement_id).toBeDefined();
      expect(result.status).toBe('approved');
    });

    it('should throw NotFoundException for invalid policy ID', async () => {
      const endorseRequest = {
        endorsement_type: 'increase_limits' as const,
        effective_date: '2025-12-15',
        details: {
          new_limits: { per_occurrence: 2000000 },
        },
      };

      await expect(
        service.addEndorsement('reliable_insurance', 'invalid-policy-id', endorseRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelPolicy', () => {
    let policyId: string;

    beforeEach(async () => {
      // Create a policy
      const quoteRequest = {
        quote_request_id: 'test_cancel_001',
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

      const quote = await quoteService.generateQuote('reliable_insurance', quoteRequest);

      const bindRequest = {
        quote_id: quote.quotes[0].quote_id,
        effective_date: '2025-12-01',
        payment_plan: 'annual' as const,
        payment_info: {
          method: 'credit_card',
          token: 'tok_test',
          billing_address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        insured_info: {
          primary_contact: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com',
            phone: '+15551234567',
          },
        },
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T10:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      const policy = await service.bindPolicy('reliable_insurance', bindRequest);
      policyId = policy.policy.policy_id;
    });

    it('should cancel policy', async () => {
      const cancelRequest = {
        cancellation_type: 'insured_request' as const,
        effective_date: '2026-01-01',
        reason: 'Testing cancellation',
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T11:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      const result = await service.cancelPolicy('reliable_insurance', policyId, cancelRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.cancellation_id).toBeDefined();
      expect(result.status).toBe('pending_cancellation');
    });

    it('should throw NotFoundException for invalid policy ID', async () => {
      const cancelRequest = {
        cancellation_type: 'insured_request' as const,
        effective_date: '2026-01-01',
        reason: 'Testing',
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T11:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      await expect(
        service.cancelPolicy('reliable_insurance', 'invalid-policy-id', cancelRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateCertificate', () => {
    let policyId: string;

    beforeEach(async () => {
      // Create a policy
      const quoteRequest = {
        quote_request_id: 'test_cert_001',
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

      const quote = await quoteService.generateQuote('reliable_insurance', quoteRequest);

      const bindRequest = {
        quote_id: quote.quotes[0].quote_id,
        effective_date: '2025-12-01',
        payment_plan: 'annual' as const,
        payment_info: {
          method: 'credit_card',
          token: 'tok_test',
          billing_address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        insured_info: {
          primary_contact: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com',
            phone: '+15551234567',
          },
        },
        signature: {
          full_name: 'John Doe',
          signed_at: '2025-11-11T10:00:00Z',
          ip_address: '192.168.1.1',
        },
      };

      const policy = await service.bindPolicy('reliable_insurance', bindRequest);
      policyId = policy.policy.policy_id;
    });

    it('should generate certificate', async () => {
      const certRequest = {
        certificate_holder: {
          name: 'Test Certificate Holder',
          address: {
            street: '123 Test St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        additional_insured: true,
        description_of_operations: 'Software development services',
      };

      const result = await service.generateCertificate('reliable_insurance', policyId, certRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.certificate_id).toBeDefined();
      expect(result.document).toBeDefined();
    });

    it('should throw NotFoundException for invalid policy ID', async () => {
      const certRequest = {
        certificate_holder: {
          name: 'Test Certificate Holder',
          address: {
            street: '123 Test St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
          },
        },
        additional_insured: true,
        description_of_operations: 'Testing',
      };

      await expect(
        service.generateCertificate('reliable_insurance', 'invalid-policy-id', certRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
