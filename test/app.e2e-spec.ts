import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Carrier API Simulator (e2e)', () => {
  let app: INestApplication;
  const API_KEY = 'test_clarence_key_123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.enableCors();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 when API key is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/quote')
        .send({
          quote_request_id: 'test_001',
          insurance_type: 'commercial',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('UNAUTHORIZED');
        });
    });

    it('should return 401 when API key is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/quote')
        .set('X-API-Key', 'wrong_key')
        .send({
          quote_request_id: 'test_001',
          insurance_type: 'commercial',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('UNAUTHORIZED');
        });
    });
  });

  describe('Quote Generation (POST /carriers/:carrier_id/quote)', () => {
    it('should generate a commercial insurance quote', () => {
      return request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/quote')
        .set('X-API-Key', API_KEY)
        .send({
          quote_request_id: 'e2e_test_001',
          insurance_type: 'commercial',
          business_info: {
            legal_name: 'E2E Test Company LLC',
            industry: 'Technology',
            industry_code: '541512',
            year_started: 2020,
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
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.carrier_id).toBe('reliable_insurance');
          expect(res.body.quotes).toBeDefined();
          expect(res.body.quotes.length).toBeGreaterThan(0);
          expect(res.body.quotes[0].coverage_type).toBe('general_liability');
        });
    });

    it('should return cached quote for identical request', async () => {
      const quoteRequest = {
        quote_request_id: 'e2e_test_cache_001',
        insurance_type: 'commercial',
        business_info: {
          legal_name: 'Cache Test Company',
          industry: 'Technology',
          industry_code: '541512',
          financial_info: {
            annual_revenue: 750000,
            full_time_employees: 8,
          },
        },
        coverage_requests: [
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

      // First request
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/carriers/techshield_underwriters/quote')
        .set('X-API-Key', API_KEY)
        .send(quoteRequest)
        .expect(200);

      expect(res1.body.cached).toBe(false);
      const firstQuoteId = res1.body.quotes[0].quote_id;

      // Second identical request
      const res2 = await request(app.getHttpServer())
        .post('/api/v1/carriers/techshield_underwriters/quote')
        .set('X-API-Key', API_KEY)
        .send(quoteRequest)
        .expect(200);

      expect(res2.body.cached).toBe(true);
      expect(res2.body.quotes[0].quote_id).toBe(firstQuoteId);
    });

    it('should return 404 for invalid carrier', () => {
      return request(app.getHttpServer())
        .post('/api/v1/carriers/invalid_carrier/quote')
        .set('X-API-Key', API_KEY)
        .send({
          quote_request_id: 'e2e_test_002',
          insurance_type: 'commercial',
          business_info: {
            legal_name: 'Test Company',
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
              requested_limits: { per_occurrence: 1000000 },
              requested_deductible: 500,
              effective_date: '2025-12-01',
            },
          ],
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('CARRIER_NOT_FOUND');
        });
    });

    it('should return 400 for invalid request', () => {
      return request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/quote')
        .set('X-API-Key', API_KEY)
        .send({
          quote_request_id: 'e2e_test_003',
          insurance_type: 'invalid_type',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('INVALID_REQUEST');
        });
    });
  });

  describe('Policy Binding (POST /carriers/:carrier_id/bind)', () => {
    let quoteId: string;

    beforeAll(async () => {
      const quoteRes = await request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/quote')
        .set('X-API-Key', API_KEY)
        .send({
          quote_request_id: 'e2e_bind_test',
          insurance_type: 'commercial',
          business_info: {
            legal_name: 'Bind Test Company',
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
              requested_limits: { per_occurrence: 1000000 },
              requested_deductible: 500,
              effective_date: '2025-12-01',
            },
          ],
        })
        .expect(200);

      if (quoteRes.status !== 200) {
        console.error('Quote generation failed:', quoteRes.body);
      }

      quoteId = quoteRes.body.quotes[0].quote_id;
    });

    it('should bind a policy from a valid quote', () => {
      return request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/bind')
        .set('X-API-Key', API_KEY)
        .send({
          quote_id: quoteId,
          effective_date: '2025-12-01',
          payment_plan: 'annual',
          payment_info: {
            method: 'credit_card',
            token: 'tok_test_123',
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
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.policy).toBeDefined();
          expect(res.body.policy.policy_id).toBeDefined();
          expect(res.body.policy.status).toBe('bound');
        });
    });

    it('should return 404 for invalid quote ID', () => {
      return request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/bind')
        .set('X-API-Key', API_KEY)
        .send({
          quote_id: 'invalid-quote-id',
          effective_date: '2025-12-01',
          payment_plan: 'annual',
          payment_info: {
            method: 'credit_card',
            token: 'tok_test',
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
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });
  });

  describe('Policy Retrieval (GET /carriers/:carrier_id/policies/:policy_id)', () => {
    let policyId: string;

    beforeAll(async () => {
      // Create a quote
      const quoteRes = await request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/quote')
        .set('X-API-Key', API_KEY)
        .send({
          quote_request_id: 'e2e_retrieve_test',
          insurance_type: 'commercial',
          business_info: {
            legal_name: 'Retrieve Test Company',
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
              requested_limits: { per_occurrence: 1000000 },
              requested_deductible: 500,
              effective_date: '2025-12-01',
            },
          ],
        })
        .expect(200);

      if (quoteRes.status !== 200) {
        console.error('Quote generation failed:', quoteRes.body);
      }

      // Bind the policy
      const bindRes = await request(app.getHttpServer())
        .post('/api/v1/carriers/reliable_insurance/bind')
        .set('X-API-Key', API_KEY)
        .send({
          quote_id: quoteRes.body.quotes[0].quote_id,
          effective_date: '2025-12-01',
          payment_plan: 'annual',
          payment_info: { method: 'credit_card', token: 'tok_test' },
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
        })
        .expect(201);

      policyId = bindRes.body.policy.policy_id;
    });

    it('should retrieve a policy by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/carriers/reliable_insurance/policies/${policyId}`)
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.policy).toBeDefined();
          expect(res.body.policy.policy_id).toBe(policyId);
        });
    });

    it('should return 404 for invalid policy ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/carriers/reliable_insurance/policies/invalid-policy-id')
        .set('X-API-Key', API_KEY)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('POLICY_NOT_FOUND');
        });
    });
  });

  describe('Health Check (GET /carriers/:carrier_id/health)', () => {
    it('should return health status for valid carrier', () => {
      return request(app.getHttpServer())
        .get('/api/v1/carriers/reliable_insurance/health')
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('operational');
          expect(res.body.carrier_id).toBe('reliable_insurance');
          expect(res.body.services).toBeDefined();
        });
    });

    it('should return status for techshield carrier', () => {
      return request(app.getHttpServer())
        .get('/api/v1/carriers/techshield_underwriters/health')
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('operational');
          expect(res.body.carrier_id).toBe('techshield_underwriters');
        });
    });
  });

  describe('Cache Management', () => {
    it('should return cache statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/carriers/cache/stats')
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.stats).toBeDefined();
          expect(res.body.stats.total_cached_quotes).toBeDefined();
        });
    });

    it('should clear cache', () => {
      return request(app.getHttpServer())
        .post('/api/v1/carriers/cache/clear')
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('Cache cleared');
        });
    });
  });
});
