import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import type { MicroblogPost } from './MicroblogPost';

@Entity('microblog_reactions')
@Index(['post', 'userId'], { unique: true })
export class MicroblogReaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne('MicroblogPost', 'reactions', { onDelete: 'CASCADE' })
  post!: MicroblogPost;

  @Column()
  userId!: string;

  @Column()
  username!: string;

  @Column({ nullable: true })
  userImage?: string;

  @Column({ default: '👾' })
  emoji!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
