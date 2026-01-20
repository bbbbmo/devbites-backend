import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BatchMeta } from "./entities/batch-meta.entity";
import { BatchTarget } from "src/common/types/batch.types";

@Injectable()
export class BatchMetaService {
  constructor(
    @InjectRepository(BatchMeta)
    private readonly batchMetaRepository: Repository<BatchMeta>
  ) {}

  async saveBatchMeta(batchId: string, targets: BatchTarget[]): Promise<void> {
    await this.batchMetaRepository.save({
      batch_id: batchId,
      status: 'PENDING',
      targets,
    });
  }

  async getPendingBatches(): Promise<BatchMeta[]> {
    return this.batchMetaRepository.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
    });
  }

  async markProcessing(batchId: string) {
    const result = await this.batchMetaRepository.update(
      { batchId, status: 'PENDING' },
      { status: 'PROCESSING' },
    );

    return result.affected === 1;
  }

  async markCompleted(batchId: string) {
    await this.batchMetaRepository.update(
      { batchId, status: 'PROCESSING' },
      { status: 'COMPLETED' },
    );
  }

  async markFailed(batchId: string) {
    await this.batchMetaRepository.update(
      { batchId, status: 'PROCESSING' },
      { status: 'FAILED' },
    );
  }
}