import { Module } from "@nestjs/common";
import { BatchService } from "./batch.service";
import { BatchMetaService } from "./batch-meta.service";
import { BatchMeta } from "./entities/batch-meta.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([BatchMeta])],
    providers: [BatchService, BatchMetaService],
    exports: [BatchService, BatchMetaService],
  })
  export class BatchModule {}