import { Entity, PrimaryColumn, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, Index } from 'typeorm';

@Entity('microblog_posts')
export class MicroblogPost {
  @PrimaryColumn()
  id!: number;

  @Column('text')
  content!: string;

  @Column('bytea', { nullable: true })
  image_data?: Buffer | null;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @OneToMany(() => MicroblogReaction, (reaction) => reaction.post)
  reactions!: MicroblogReaction[];
}

@Entity('microblog_reactions')
@Index(['post', 'userId'], { unique: true })
export class MicroblogReaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => MicroblogPost, (post) => post.reactions, { onDelete: 'CASCADE' })
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
