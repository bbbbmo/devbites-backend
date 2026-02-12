import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column({
    type: 'varchar',
    name: 'uid',
    length: 255,
    nullable: false,
  })
  uid: string; // Firebase uid

  @Column({
    type: 'varchar',
    name: 'email',
    length: 255,
    nullable: false,
  })
  email: string;

  @Column({
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
