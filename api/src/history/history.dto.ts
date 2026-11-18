import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// What the app sends after a comparison. The user comes from the access token, never the body.
export class CreateHistoryDto {
  @IsInt()
  @Min(1)
  @Max(2147483647)
  AppId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  GameName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  CpuName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  GpuName?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4096)
  RamGb?: number | null;

  @IsInt()
  @Min(0)
  @Max(100)
  Met: number;

  @IsInt()
  @Min(0)
  @Max(100)
  Failed: number;

  @IsInt()
  @Min(0)
  @Max(100)
  ToCheck: number;
}

// One history entry as the API returns it.
export interface HistoryItemDto {
  id: number;
  AppId: number;
  GameName: string;
  CpuName: string | null;
  GpuName: string | null;
  RamGb: number | null;
  Met: number;
  Failed: number;
  ToCheck: number;
  created_at: Date;
  updated_at: Date;
}
