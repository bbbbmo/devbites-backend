import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column({
    type: 'int',
    name: 'blog_id',
    nullable: false,
  })
  blogId: number;

  @Column({
    type: 'varchar',
    name: 'title',
    length: 100,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    name: 'short_summary',
    nullable: false,
  })
  shortSummary: string;

  @Column({
    type: 'longtext',
    name: 'detailed_summary',
    nullable: false,
  })
  detailedSummary: string;

  @Column({
    type: 'varchar',
    name: 'source_url',
    length: 2048,
    nullable: false,
  })
  sourceUrl: string;

  @Column({
    type: 'datetime',
    name: 'published_at',
    nullable: false,
  })
  publishedAt: Date;

  @Column({
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @Column({
    type: 'datetime',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;
}
