import { IsString, IsBoolean, IsArray, IsOptional, ValidateNested } from 'class-validator';
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

class CertificateHolderDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

export class CertificateRequestDto {
  @ValidateNested()
  @Type(() => CertificateHolderDto)
  certificate_holder: CertificateHolderDto;

  @IsBoolean()
  additional_insured: boolean;

  @IsString()
  description_of_operations: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  special_provisions?: string[];

  @IsOptional()
  @IsString()
  project_number?: string;

  @IsOptional()
  @IsString()
  project_description?: string;
}
