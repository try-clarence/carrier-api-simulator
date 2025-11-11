import { IsString, IsObject, IsEnum, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  suite?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip: string;
}

class PaymentInfoDto {
  @IsString()
  method: string;

  @IsString()
  token: string;

  @ValidateNested()
  @Type(() => AddressDto)
  billing_address: AddressDto;
}

class ContactDto {
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

class AdditionalInsuredDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  relationship?: string;
}

class InsuredInfoDto {
  @ValidateNested()
  @Type(() => ContactDto)
  primary_contact: ContactDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalInsuredDto)
  additional_insureds?: AdditionalInsuredDto[];
}

class SignatureDto {
  @IsString()
  full_name: string;

  @IsString()
  signed_at: string;

  @IsString()
  ip_address: string;
}

export class BindRequestDto {
  @IsString()
  quote_id: string;

  @IsString()
  effective_date: string;

  @IsEnum(['monthly', 'quarterly', 'annual'])
  payment_plan: string;

  @ValidateNested()
  @Type(() => PaymentInfoDto)
  payment_info: PaymentInfoDto;

  @ValidateNested()
  @Type(() => InsuredInfoDto)
  insured_info: InsuredInfoDto;

  @ValidateNested()
  @Type(() => SignatureDto)
  signature: SignatureDto;

  @IsOptional()
  @IsObject()
  customizations?: any;
}
