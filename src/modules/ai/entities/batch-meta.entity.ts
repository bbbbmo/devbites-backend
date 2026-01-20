import { BatchTarget } from "src/common/types/batch.types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('batch_meta')
export class BatchMeta {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column({ unique: true, name: 'batch_id' })
  batchId: string;

  @Column({
    type: 'enum',
    name: 'status',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @Column({ type: 'json', name: 'targets' })
  targets: BatchTarget[];

  @Column({
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @Column({
    type: 'datetime',
    name: 'completed_at',
    nullable: true,
  })
  completedAt: Date | null;
}
