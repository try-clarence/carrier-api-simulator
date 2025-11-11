import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SignatureDto {
  @IsString()
  full_name: string;

  @IsString()
  signed_at: string;

  @IsString()
  ip_address: string;
}

export class CancelRequestDto {
  @IsString()
  cancellation_type: string;

  @IsString()
  effective_date: string;

  @IsString()
  reason: string;

  @ValidateNested()
  @Type(() => SignatureDto)
  signature: SignatureDto;
}
