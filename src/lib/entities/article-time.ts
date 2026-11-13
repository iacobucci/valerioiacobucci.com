import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('article_writing_time')
export class ArticleWritingTime {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'integer', default: 0 })
  seconds_spent!: number;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  last_active_at!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
