import { IsString, IsObject, ValidateNested, IsOptional } from 'class-validator';
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

export class EndorseRequestDto {
  @IsString()
  endorsement_type: string;

  @IsString()
  effective_date: string;

  @IsObject()
  details: {
    additional_insured?: AdditionalInsuredDto;
    new_limits?: Record<string, number>;
    [key: string]: any;
  };
}
