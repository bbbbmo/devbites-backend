import { BatchTarget } from "src/common/types/batch.types";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('batch_meta')
export class BatchMeta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  batchId: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @Column({ type: 'json' })
  targets: BatchTarget[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt: Date | null;
}
