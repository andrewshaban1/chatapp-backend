import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty.' })
  @MaxLength(5000, { message: 'Message is too long.' })
  content: string;
}
