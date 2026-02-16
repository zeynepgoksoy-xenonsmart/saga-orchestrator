// saga.module.ts
import { Module } from '@nestjs/common';
import { SagaController } from './saga.controller';
import { SagaService } from './saga.service';
import { AccountClientService } from '../clients/account-client.service';
import { WorkspaceClientService } from '../clients/workspace-client.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import 'dotenv/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: 'ACCOUNT_GRPC',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get('ACCOUNT_SERVICE_URL') || 'localhost:50051',
            package: 'account',
            protoPath: join(process.cwd(), '../proto/account.proto'),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'WORKSPACE_GRPC',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get('WORKSPACE_SERVICE_URL') || 'localhost:50052',
            package: 'workspace',
            protoPath: join(process.cwd(), '../proto/workspace.proto'),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [SagaController],
  providers: [SagaService, AccountClientService, WorkspaceClientService],
})
export class SagaModule {}
