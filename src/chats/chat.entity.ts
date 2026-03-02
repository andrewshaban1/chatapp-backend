import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Message } from '@/src/messages/message.entity';
import { User } from '@/src/users/user.entity';

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ChatType, default: ChatType.DIRECT })
  type: ChatType;

  // Only relevant for group chats — null for direct messages
  @Column({ type: 'varchar', nullable: true, length: 100 })
  name: string | null;

  // The user who created the chat — useful for group admin logic later
  @Column({ type: 'integer', name: 'created_by', nullable: true })
  createdBy: number | null;

  @ManyToMany(() => User, (user) => user.chats, { eager: false })
  @JoinTable({
    name: 'chat_participants',
    joinColumn: { name: 'chat_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];

  // Latest message — populated manually in service for chat list performance
  lastMessage?: Message;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
