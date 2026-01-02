import { Blog } from 'src/modules/blog/entities/blog.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @RelationId((post: Post) => post.blog)
  blogId: number;

  @ManyToOne(() => Blog, (blog) => blog.id)
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @Column({
    type: 'varchar',
    name: 'title',
    length: 100,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'varchar',
    name: 'author',
    length: 50,
    nullable: false,
  })
  author: string;

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
