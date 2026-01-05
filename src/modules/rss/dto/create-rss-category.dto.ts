import { IsString, IsNotEmpty, MaxLength, IsNumber } from 'class-validator';

export class CreateRssCategoryDto {
  @IsNotEmpty()
  @IsNumber()
  postId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;
}
