import { IsString, IsObject, IsOptional } from 'class-validator';

export class RenewRequestDto {
  @IsString()
  renewal_type: string;

  @IsOptional()
  @IsObject()
  business_changes?: {
    revenue_changed?: boolean;
    new_annual_revenue?: number;
    employees_changed?: boolean;
    new_full_time_employees?: number;
    new_part_time_employees?: number;
    locations_changed?: boolean;
    operations_changed?: boolean;
  };

  @IsOptional()
  @IsObject()
  coverage_changes?: {
    increase_limits?: boolean;
    new_limits?: Record<string, number>;
    add_coverages?: string[];
    remove_coverages?: string[];
  };

  @IsOptional()
  @IsString()
  desired_effective_date?: string;
}
