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
}
