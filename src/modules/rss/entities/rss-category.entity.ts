import { Post } from 'src/modules/post/entities/post.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';

@Entity('rss_category')
export class RssCategory {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @RelationId((rssCategory: RssCategory) => rssCategory.post)
  postId: number;

  @ManyToOne(() => Post, (post) => post.id)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({
    type: 'varchar',
    name: 'name',
    length: 50,
  })
  name: string;
}
