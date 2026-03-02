import {
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { ChatType } from '@/src/chats/chat.entity';

export class CreateChatRequestDto {
  @IsEnum(ChatType)
  type: ChatType;

  // Required for group chats, ignored for direct
  @ValidateIf((o: CreateChatRequestDto) => o.type === ChatType.GROUP)
  @IsString()
  @MaxLength(100)
  name?: string;

  // List of participant user IDs to add (excluding the creator, added automatically)
  @IsArray()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { each: true })
  participantIds: number[];
}
