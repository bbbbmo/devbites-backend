import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blog')
export class Blog {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column({
    type: 'varchar',
    name: 'name',
    length: 100,
  })
  name: string;

  @Column({
    type: 'varchar',
    name: 'rss_url',
    length: 2048,
  })
  rssUrl: string;

  @Column({
    type: 'varchar',
    name: 'blog_url',
    length: 2048,
  })
  blogUrl: string;
}
