// saga.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SagaController } from './saga.controller';
import { SagaService } from './saga.service';
import { AccountClientService } from '../clients/account-client.service';
import { WorkspaceClientService } from '../clients/workspace-client.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [SagaController],
  providers: [SagaService, AccountClientService, WorkspaceClientService],
})
export class SagaModule {}