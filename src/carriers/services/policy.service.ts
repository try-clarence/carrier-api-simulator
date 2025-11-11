import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MockDataService } from './mock-data.service';
import { QuoteService } from './quote.service';
import { BindRequestDto } from '../dto/bind-request.dto';
import { RenewRequestDto } from '../dto/renew-request.dto';
import { EndorseRequestDto } from '../dto/endorse-request.dto';
import { CancelRequestDto } from '../dto/cancel-request.dto';
import { CertificateRequestDto } from '../dto/certificate-request.dto';

@Injectable()
export class PolicyService {
  private policies = new Map<string, any>();
  private endorsements = new Map<string, any[]>();
  private certificates = new Map<string, any[]>();

  constructor(
    private mockDataService: MockDataService,
    private quoteService: QuoteService,
  ) {}

  async bindPolicy(carrierId: string, bindRequest: BindRequestDto) {
    const quote = this.quoteService.getQuote(bindRequest.quote_id);

    if (!quote) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Quote '${bindRequest.quote_id}' not found`,
        },
      });
    }

    // Check if quote is expired
    const validUntil = new Date(quote.valid_until);
    if (new Date() > validUntil) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'QUOTE_EXPIRED',
          message: 'Quote has expired and is no longer bindable',
          expired_at: quote.valid_until,
          quote_id: bindRequest.quote_id,
        },
      });
    }

    const selectedQuote = quote.selectedQuote || quote.quotes[0];
    const policyId = this.mockDataService.generatePolicyId(carrierId);
    const policyNumber = this.mockDataService.generatePolicyNumber(
      carrierId,
      selectedQuote.coverage_type,
    );

    const monthlyAmount =
      bindRequest.payment_plan === 'monthly'
        ? selectedQuote.premium.monthly
        : bindRequest.payment_plan === 'quarterly'
          ? selectedQuote.premium.quarterly
          : selectedQuote.premium.annual;

    const policy = {
      policy_id: policyId,
      policy_number: policyNumber,
      status: 'bound',
      insurance_type: quote.quoteRequest.insurance_type,
      coverage_type: selectedQuote.coverage_type,
      effective_date: bindRequest.effective_date,
      expiration_date: selectedQuote.expiration_date,
      insured_name:
        quote.quoteRequest.business_info?.legal_name ||
        `${quote.quoteRequest.personal_info?.first_name} ${quote.quoteRequest.personal_info?.last_name}`,
      insured_address: this.formatAddress(
        quote.quoteRequest.business_info?.address || quote.quoteRequest.personal_info?.address,
      ),
      coverage_limits: selectedQuote.coverage_limits,
      premium: {
        annual: selectedQuote.premium.annual,
        payment_plan: bindRequest.payment_plan,
        monthly_amount: monthlyAmount,
        first_payment_due: bindRequest.effective_date,
        next_payment_date: this.calculateNextPaymentDate(
          bindRequest.effective_date,
          bindRequest.payment_plan,
        ),
      },
      deductible: selectedQuote.deductible,
      carrier_contact: {
        policy_service_phone: '1-800-555-0300',
        claims_phone: '1-800-555-0400',
        email: `service@${carrierId.replace('_', '')}.com`,
        claims_email: `claims@${carrierId.replace('_', '')}.com`,
      },
      documents: [
        {
          type: 'policy',
          name: `${selectedQuote.coverage_type} Policy`,
          url: `https://carrier-simulator.example.com/documents/${policyId}/policy.pdf`,
          size_bytes: 524288,
          generated_at: new Date().toISOString(),
        },
        {
          type: 'declarations',
          name: 'Declarations Page',
          url: `https://carrier-simulator.example.com/documents/${policyId}/declarations.pdf`,
          size_bytes: 102400,
          generated_at: new Date().toISOString(),
        },
      ],
      endorsements: [],
      additional_insureds: bindRequest.insured_info.additional_insureds || [],
    };

    const response = {
      success: true,
      carrier_id: carrierId,
      bind_id: `${this.mockDataService.getCarrierConfig(carrierId).prefix}-B-${Date.now()}`,
      policy,
      payment_confirmation: {
        payment_id: `pay_${Date.now()}`,
        amount: monthlyAmount,
        currency: 'USD',
        payment_method: `card_ending_${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0')}`,
        status: 'succeeded',
        receipt_url: `https://carrier-simulator.example.com/receipts/pay_${Date.now()}.pdf`,
      },
      bound_at: new Date().toISOString(),
      confirmation_email_sent: true,
      next_steps: [
        'Policy documents are ready for download',
        `First payment will be charged on ${bindRequest.effective_date}`,
        'Certificate of insurance available immediately',
        '24/7 customer service available',
      ],
    };

    this.policies.set(policyId, {
      policy,
      bindRequest,
      quote,
      createdAt: new Date().toISOString(),
    });

    return response;
  }

  async getPolicy(carrierId: string, policyId: string) {
    const policyData = this.policies.get(policyId);

    if (!policyData) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'POLICY_NOT_FOUND',
          message: `Policy '${policyId}' not found`,
        },
      });
    }

    const policy = policyData.policy;
    const daysUntilExpiration = Math.floor(
      (new Date(policy.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      success: true,
      policy: {
        ...policy,
        days_until_expiration: daysUntilExpiration,
        status: daysUntilExpiration < 0 ? 'expired' : 'active',
      },
    };
  }

  async renewPolicy(carrierId: string, policyId: string, renewRequest: RenewRequestDto) {
    const policyData = this.policies.get(policyId);

    if (!policyData) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'POLICY_NOT_FOUND',
          message: `Policy '${policyId}' not found`,
        },
      });
    }

    const originalPolicy = policyData.policy;
    const basePremium = originalPolicy.premium.annual;

    // Calculate new premium based on changes
    let newPremium = basePremium;
    const reasons = [];

    if (renewRequest.business_changes?.revenue_changed) {
      const increase = 10; // 10% increase
      newPremium += basePremium * (increase / 100);
      reasons.push(
        `Revenue increase: +${increase}% (+$${Math.round(basePremium * (increase / 100))} premium)`,
      );
    }

    if (renewRequest.business_changes?.employees_changed) {
      const increase = 5;
      newPremium += basePremium * (increase / 100);
      reasons.push(
        `Employee count increase: +${increase}% (+$${Math.round(basePremium * (increase / 100))} premium)`,
      );
    }

    if (renewRequest.coverage_changes?.increase_limits) {
      const increase = 15;
      newPremium += basePremium * (increase / 100);
      reasons.push(
        `Limit increase: +${increase}% (+$${Math.round(basePremium * (increase / 100))} premium)`,
      );
    }

    // Loyalty discount
    const loyaltyDiscount = 5;
    const discountAmount = newPremium * (loyaltyDiscount / 100);
    newPremium -= discountAmount;
    reasons.push(
      `Loyalty discount: -${loyaltyDiscount}% (-$${Math.round(discountAmount)} premium)`,
    );

    newPremium = Math.round(newPremium);

    const renewalQuoteId = `${this.mockDataService.getCarrierConfig(carrierId).prefix}-RQ-${Date.now()}`;

    return {
      success: true,
      renewal_quote_id: renewalQuoteId,
      original_policy_id: policyId,
      renewal_status: 'quoted',
      quote: {
        quote_id: `${renewalQuoteId}-${originalPolicy.coverage_type}`,
        coverage_type: originalPolicy.coverage_type,
        effective_date: renewRequest.desired_effective_date || originalPolicy.expiration_date,
        expiration_date: this.addOneYear(
          renewRequest.desired_effective_date || originalPolicy.expiration_date,
        ),
        coverage_limits:
          renewRequest.coverage_changes?.new_limits || originalPolicy.coverage_limits,
        premium: {
          annual: newPremium,
          monthly: Math.round(newPremium / 12),
          quarterly: Math.round(newPremium / 4),
        },
        premium_change: {
          amount: newPremium - basePremium,
          percentage: Math.round(((newPremium - basePremium) / basePremium) * 100),
          reasons,
        },
        deductible: originalPolicy.deductible,
        loyalty_discount: {
          percentage: loyaltyDiscount,
          amount: Math.round(discountAmount),
          description: 'Claims-free discount',
        },
        valid_until: this.addDays(new Date(), 30).toISOString(),
        highlights: [
          'All prior endorsements maintained',
          'No underwriting required for renewal',
          'Streamlined renewal process',
        ],
      },
      underwriting_notes: [
        'Positive renewal eligibility',
        'No claims in prior term',
        'Automatic renewal available',
      ],
      bind_eligibility: 'eligible_automatic',
      next_steps: [
        'Review renewal quote',
        'Accept renewal to bind new policy',
        `Current policy expires ${originalPolicy.expiration_date}`,
      ],
    };
  }

  async addEndorsement(carrierId: string, policyId: string, endorseRequest: EndorseRequestDto) {
    const policyData = this.policies.get(policyId);

    if (!policyData) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'POLICY_NOT_FOUND',
          message: `Policy '${policyId}' not found`,
        },
      });
    }

    const endorsementId = `${this.mockDataService.getCarrierConfig(carrierId).prefix}-END-${Date.now()}`;
    const additionalPremium = 25; // Flat fee for simplicity

    const endorsement = {
      endorsement_id: endorsementId,
      policy_id: policyId,
      status: 'approved',
      endorsement_type: endorseRequest.endorsement_type,
      effective_date: endorseRequest.effective_date,
      premium_change: {
        amount: additionalPremium,
        annual_adjustment: additionalPremium,
        pro_rated_charge: Math.round(additionalPremium * 0.92),
        explanation: 'Endorsement fee, pro-rated to policy expiration',
      },
      documents: [
        {
          type: 'endorsement',
          name: `Endorsement - ${endorseRequest.endorsement_type.replace(/_/g, ' ')}`,
          url: `https://carrier-simulator.example.com/documents/${endorsementId}.pdf`,
          generated_at: new Date().toISOString(),
        },
      ],
      confirmation_email_sent: true,
      next_steps: [
        `Endorsement effective ${endorseRequest.effective_date}`,
        'Updated documents available for download',
        'New certificate of insurance can be generated',
      ],
    };

    // Store endorsement
    if (!this.endorsements.has(policyId)) {
      this.endorsements.set(policyId, []);
    }
    this.endorsements.get(policyId).push(endorsement);

    return {
      success: true,
      ...endorsement,
      updated_policy_summary: {
        total_annual_premium: policyData.policy.premium.annual + additionalPremium,
        endorsements_count: this.endorsements.get(policyId).length,
      },
    };
  }

  async cancelPolicy(carrierId: string, policyId: string, cancelRequest: CancelRequestDto) {
    const policyData = this.policies.get(policyId);

    if (!policyData) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'POLICY_NOT_FOUND',
          message: `Policy '${policyId}' not found`,
        },
      });
    }

    const policy = policyData.policy;
    const daysActive = Math.floor(
      (new Date(cancelRequest.effective_date).getTime() -
        new Date(policy.effective_date).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const totalDays = 365;
    const percentageEarned = daysActive / totalDays;
    const earnedPremium = Math.round(policy.premium.annual * percentageEarned);
    const unearnedPremium = policy.premium.annual - earnedPremium;
    const cancellationFee = 50;
    const netRefund = unearnedPremium - cancellationFee;

    return {
      success: true,
      cancellation_id: `${this.mockDataService.getCarrierConfig(carrierId).prefix}-CAN-${Date.now()}`,
      policy_id: policyId,
      policy_number: policy.policy_number,
      status: 'pending_cancellation',
      effective_date: cancelRequest.effective_date,
      cancellation_type: cancelRequest.cancellation_type,
      refund: {
        earned_premium: earnedPremium,
        unearned_premium: unearnedPremium,
        cancellation_fee: cancellationFee,
        short_rate_penalty: 0,
        net_refund: netRefund,
        refund_method: 'original_payment_method',
        estimated_refund_date: this.addDays(new Date(cancelRequest.effective_date), 15)
          .toISOString()
          .split('T')[0],
        refund_breakdown: {
          total_premium_paid: earnedPremium,
          days_policy_active: daysActive,
          total_days: totalDays,
          percentage_earned: Math.round(percentageEarned * 100),
        },
      },
      documents: [
        {
          type: 'cancellation_notice',
          name: 'Cancellation Notice',
          url: `https://carrier-simulator.example.com/documents/cancellation_${Date.now()}.pdf`,
          generated_at: new Date().toISOString(),
        },
      ],
      important_notes: [
        `Policy coverage ends at 12:01 AM on ${cancelRequest.effective_date}`,
        'No coverage after cancellation date',
        'Refund will be processed within 15 business days',
        'Consider obtaining replacement coverage before cancellation',
      ],
      confirmation_email_sent: true,
      next_steps: [
        'Cancellation notice sent to your email',
        `Secure replacement coverage before ${cancelRequest.effective_date}`,
        `Refund of $${netRefund} will be issued`,
      ],
    };
  }

  async generateCertificate(
    carrierId: string,
    policyId: string,
    certRequest: CertificateRequestDto,
  ) {
    const policyData = this.policies.get(policyId);

    if (!policyData) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'POLICY_NOT_FOUND',
          message: `Policy '${policyId}' not found`,
        },
      });
    }

    const policy = policyData.policy;
    const certificateId = `${this.mockDataService.getCarrierConfig(carrierId).prefix}-CERT-${Date.now()}`;

    const certificate = {
      certificate_id: certificateId,
      policy_id: policyId,
      certificate_number: `CERT-${certificateId}`,
      issued_date: new Date().toISOString().split('T')[0],
      certificate_holder: {
        name: certRequest.certificate_holder.name,
        address: this.formatAddress(certRequest.certificate_holder.address),
      },
      format: 'ACORD 25',
      document: {
        url: `https://carrier-simulator.example.com/certificates/${certificateId}.pdf`,
        format: 'PDF',
        size_bytes: 245760,
      },
      generated_at: new Date().toISOString(),
      expires_at: policy.expiration_date,
      coverage_summary: {
        coverage_type: policy.coverage_type,
        limits: Object.values(policy.coverage_limits).join('/'),
        policy_number: policy.policy_number,
        effective_date: policy.effective_date,
        expiration_date: policy.expiration_date,
      },
      description_of_operations: certRequest.description_of_operations,
      special_provisions: certRequest.special_provisions || [],
      confirmation_email_sent: true,
      next_steps: [
        'Certificate ready for download',
        'Valid until policy expiration',
        'Can generate additional certificates as needed',
      ],
    };

    // Store certificate
    if (!this.certificates.has(policyId)) {
      this.certificates.set(policyId, []);
    }
    this.certificates.get(policyId).push(certificate);

    return {
      success: true,
      ...certificate,
    };
  }

  private formatAddress(address: any): string {
    if (!address) return '';
    return `${address.street || ''}, ${address.city}, ${address.state} ${address.zip}`;
  }

  private calculateNextPaymentDate(effectiveDate: string, paymentPlan: string): string {
    const date = new Date(effectiveDate);
    if (paymentPlan === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (paymentPlan === 'quarterly') {
      date.setMonth(date.getMonth() + 3);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString().split('T')[0];
  }

  private addOneYear(dateString: string): string {
    const date = new Date(dateString);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
