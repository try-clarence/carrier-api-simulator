import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip: string;
}

class PersonalInfoDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  marital_status?: string;

  @IsString()
  occupation: string;

  @IsEnum(['excellent', 'good', 'fair', 'poor'])
  credit_score_tier: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class FinancialInfoDto {
  @IsNumber()
  annual_revenue: number;

  @IsOptional()
  @IsNumber()
  annual_payroll?: number;

  @IsNumber()
  full_time_employees: number;

  @IsOptional()
  @IsNumber()
  part_time_employees?: number;

  @IsOptional()
  @IsNumber()
  contractors?: number;
}

class ContactInfoDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  title?: string;
}

class BusinessInfoDto {
  @IsString()
  legal_name: string;

  @IsOptional()
  @IsString()
  dba_name?: string;

  @IsOptional()
  @IsString()
  legal_structure?: string;

  @IsString()
  industry: string;

  @IsString()
  industry_code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  year_started?: number;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ValidateNested()
  @Type(() => FinancialInfoDto)
  financial_info: FinancialInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info?: ContactInfoDto;
}

class PropertyInfoDto {
  @IsOptional()
  @IsNumber()
  dwelling_value?: number;

  @IsOptional()
  @IsNumber()
  year_built?: number;

  @IsOptional()
  @IsNumber()
  square_feet?: number;

  @IsOptional()
  @IsString()
  construction_type?: string;

  @IsOptional()
  @IsString()
  roof_type?: string;

  @IsOptional()
  @IsNumber()
  roof_age?: number;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsBoolean()
  garage?: boolean;

  @IsOptional()
  @IsBoolean()
  pool?: boolean;

  @IsOptional()
  @IsBoolean()
  alarm_system?: boolean;
}

class VehicleInfoDto {
  @IsNumber()
  year: number;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  usage?: string;

  @IsOptional()
  @IsNumber()
  annual_mileage?: number;
}

class CyberInfoDto {
  @IsOptional()
  @IsBoolean()
  has_cybersecurity_policy?: boolean;

  @IsOptional()
  @IsBoolean()
  has_incident_response_plan?: boolean;

  @IsOptional()
  @IsBoolean()
  handles_pii?: boolean;

  @IsOptional()
  @IsNumber()
  number_of_records?: number;

  @IsOptional()
  @IsBoolean()
  has_encryption?: boolean;

  @IsOptional()
  @IsBoolean()
  has_mfa?: boolean;
}

class CoverageRequestDto {
  @IsString()
  coverage_type: string;

  @IsObject()
  requested_limits: Record<string, number>;

  @IsNumber()
  requested_deductible: number;

  @IsString()
  effective_date: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyInfoDto)
  property_info?: PropertyInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleInfoDto)
  vehicle_info?: VehicleInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CyberInfoDto)
  cyber_info?: CyberInfoDto;
}

export class QuoteRequestDto {
  @IsString()
  quote_request_id: string;

  @IsEnum(['personal', 'commercial'])
  insurance_type: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personal_info?: PersonalInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessInfoDto)
  business_info?: BusinessInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageRequestDto)
  coverage_requests: CoverageRequestDto[];

  @IsOptional()
  @IsObject()
  additional_data?: any;
}
