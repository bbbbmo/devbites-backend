import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsDate,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  author: string;

  @IsNotEmpty()
  @IsString()
  shortSummary: string;

  @IsNotEmpty()
  @IsString()
  detailedSummary: string;

  @IsNotEmpty()
  @IsUrl()
  @MaxLength(2048)
  sourceUrl: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  publishedAt: Date;

  @IsNotEmpty()
  blogId: number;
}
