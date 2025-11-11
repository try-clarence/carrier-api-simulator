import { Injectable } from '@nestjs/common';

@Injectable()
export class MockDataService {
  private carrierConfigs = {
    reliable_insurance: {
      name: 'Reliable Insurance Co.',
      prefix: 'RIC',
      pricingMultiplier: 1.0,
      approvalRate: 0.85,
    },
    techshield_underwriters: {
      name: 'TechShield Underwriters',
      prefix: 'TSU',
      pricingMultiplier: 0.95,
      approvalRate: 0.9,
    },
    premier_underwriters: {
      name: 'Premier Underwriters',
      prefix: 'PRE',
      pricingMultiplier: 1.25,
      approvalRate: 0.7,
    },
    fastbind_insurance: {
      name: 'FastBind Insurance',
      prefix: 'FBI',
      pricingMultiplier: 0.85,
      approvalRate: 0.95,
    },
  };

  getCarrierConfig(carrierId: string) {
    return this.carrierConfigs[carrierId];
  }

  generateQuoteId(carrierId: string, coverageType: string, seed?: string): string {
    const config = this.carrierConfigs[carrierId];
    const year = new Date().getFullYear();
    // Use timestamp-based random for uniqueness, but deterministic for same request
    const random = seed
      ? this.seededRandom(seed, 999999).toString().padStart(6, '0')
      : Math.floor(Math.random() * 999999)
          .toString()
          .padStart(6, '0');
    const coverageSuffix = this.getCoverageSuffix(coverageType);
    return `${config.prefix}-Q-${year}-${random}-${coverageSuffix}`;
  }

  generatePolicyId(carrierId: string): string {
    const config = this.carrierConfigs[carrierId];
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, '0');
    return `${config.prefix}-P-${year}-${random}`;
  }

  generatePolicyNumber(carrierId: string, coverageType: string): string {
    const config = this.carrierConfigs[carrierId];
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, '0');
    const coverageSuffix = this.getCoverageSuffix(coverageType);
    return `${config.prefix}-${year}-${coverageSuffix}-${random}`;
  }

  /**
   * Generate a seeded pseudo-random number for deterministic results
   * Same seed always produces the same number
   */
  private seededRandom(seed: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % max;
  }

  private getCoverageSuffix(coverageType: string): string {
    const suffixes = {
      homeowners: 'HO',
      auto: 'AU',
      renters: 'RN',
      life: 'LF',
      personal_umbrella: 'UM',
      general_liability: 'GL',
      professional_liability: 'PL',
      cyber_liability: 'CY',
      workers_compensation: 'WC',
      commercial_property: 'CP',
      business_auto: 'BA',
      umbrella: 'UM',
      directors_officers: 'DO',
      employment_practices: 'EP',
      crime: 'CR',
      media: 'MD',
      fiduciary: 'FD',
      employee_benefits: 'EB',
    };
    return suffixes[coverageType] || 'XX';
  }

  calculateBasePremium(
    coverageType: string,
    requestedLimits: any,
    businessInfo?: any,
    personalInfo?: any,
    seed?: string,
  ): number {
    // Simple pricing logic based on coverage type
    const basePrices = {
      // Personal
      homeowners: 1200,
      auto: 900,
      renters: 250,
      life: 500,
      personal_umbrella: 300,
      // Commercial
      general_liability: 1250,
      professional_liability: 2500,
      cyber_liability: 3000,
      workers_compensation: 1800,
      commercial_property: 2000,
      business_auto: 1500,
      umbrella: 800,
      directors_officers: 3500,
      employment_practices: 2200,
      crime: 1000,
      media: 1800,
      fiduciary: 2500,
      employee_benefits: 1200,
    };

    let base = basePrices[coverageType] || 1000;

    // Adjust based on limits
    if (requestedLimits) {
      const limitValue = Object.values(requestedLimits)[0] as number;
      if (limitValue) {
        base = base * (limitValue / 1000000);
      }
    }

    // Adjust for business revenue
    if (businessInfo?.financial_info?.annual_revenue) {
      const revenue = businessInfo.financial_info.annual_revenue;
      base = base * (1 + revenue / 5000000);
    }

    // Add deterministic "randomness" if seed provided, otherwise random
    let randomFactor: number;
    if (seed) {
      // Deterministic variation between 0.9 and 1.1 (±10%)
      const seedValue = this.seededRandom(seed + coverageType, 1000) / 1000; // 0 to 1
      randomFactor = 0.9 + seedValue * 0.2; // 0.9 to 1.1
    } else {
      randomFactor = 0.9 + Math.random() * 0.2;
    }

    return Math.round(base * randomFactor);
  }

  generateHighlights(coverageType: string): string[] {
    const highlights = {
      general_liability: [
        'Coverage for bodily injury and property damage',
        'Legal defense costs covered in addition to limits',
        'Medical payments included',
        'Products and completed operations coverage',
        'Contractual liability coverage',
      ],
      cyber_liability: [
        'Data breach notification and credit monitoring',
        'Forensic investigation costs',
        'Business interruption from cyber events',
        'Cyber extortion and ransomware coverage',
        '24/7 incident response hotline',
      ],
      professional_liability: [
        'Covers professional errors and omissions',
        'Defense costs in addition to policy limits',
        'Prior acts coverage included',
        'Extended reporting period available',
        'Contractual liability coverage',
      ],
      homeowners: [
        'Replacement cost dwelling coverage',
        'Personal property coverage',
        'Liability protection',
        'Additional living expenses covered',
        '24/7 claims support',
      ],
      auto: [
        'Liability coverage',
        'Collision and comprehensive coverage',
        'Uninsured/underinsured motorist protection',
        'Roadside assistance available',
        'Rental car reimbursement',
      ],
    };

    return (
      highlights[coverageType] || [
        'Comprehensive coverage',
        'Competitive rates',
        '24/7 support',
        'Fast claims processing',
        'Flexible payment options',
      ]
    );
  }

  generateExclusions(coverageType: string): string[] {
    const exclusions = {
      general_liability: [
        'Professional services (covered by E&O)',
        'Pollution liability',
        'Employee injuries (covered by Workers Comp)',
        'Auto liability (requires separate policy)',
        'Cyber incidents (requires cyber policy)',
      ],
      cyber_liability: [
        'War and terrorism',
        'Failure to maintain required security standards',
        'Theft of intellectual property',
        'Loss of future revenue',
      ],
      professional_liability: [
        'Bodily injury or property damage',
        'Intentional acts or fraud',
        'Violations of securities laws',
        'Patent or trademark infringement',
      ],
      homeowners: [
        'Flood damage (requires separate policy)',
        'Earthquake damage',
        'Wear and tear',
        'Intentional damage',
        'Business activities',
      ],
    };

    return (
      exclusions[coverageType] || [
        'Intentional acts',
        'War and terrorism',
        'Nuclear hazards',
        'Certain natural disasters',
      ]
    );
  }

  generateOptionalCoverages(coverageType: string): any[] {
    const options = {
      general_liability: [
        {
          name: 'Hired and Non-Owned Auto Liability',
          additional_premium: 125,
          description: 'Liability for rented, leased, or borrowed vehicles',
        },
        {
          name: 'Employee Benefits Liability',
          additional_premium: 300,
          description: 'Coverage for errors in benefits administration',
        },
      ],
      cyber_liability: [
        {
          name: 'Social Engineering Coverage',
          additional_premium: 450,
          description: 'Coverage for funds transfer fraud',
        },
        {
          name: 'Media Liability',
          additional_premium: 600,
          description: 'Copyright infringement and defamation coverage',
        },
      ],
    };

    return options[coverageType] || [];
  }

  generateUnderwritingNotes(
    coverageType: string,
    businessInfo?: any,
    personalInfo?: any,
  ): string[] {
    const notes = [];

    if (businessInfo) {
      if (businessInfo.financial_info.annual_revenue < 1000000) {
        notes.push('Small business with manageable risk profile');
      }
      if (businessInfo.industry.toLowerCase().includes('tech')) {
        notes.push('Technology sector - aligned with carrier specialization');
      }
      notes.push('No prior claims history reported');
    }

    if (personalInfo) {
      if (personalInfo.credit_score_tier === 'excellent') {
        notes.push('Excellent credit score provides 15% discount');
      }
      if (personalInfo.credit_score_tier === 'good') {
        notes.push('Good credit score provides 10% discount');
      }
    }

    notes.push('Competitive market conditions');
    notes.push('Standard underwriting approval');

    return notes;
  }
}
