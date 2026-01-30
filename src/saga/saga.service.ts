// saga.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AccountClientService } from '../clients/account-client.service';
import { WorkspaceClientService } from '../clients/workspace-client.service';
import { v4 as uuidv4 } from 'uuid';
import { SagaStep } from './types/saga-step.type';
import { SagaResponseDto } from './dto/saga-response.dto';
import { CreateUserSagaDataDto } from './dto/create-user-saga.dto';
import { SagaStatus } from '../common/saga-status.enum';
import type { AccountResponse } from '../../../proto/generated/account';
import type { WorkspaceResponse } from '../../../proto/generated/workspace';

@Injectable()
export class SagaService {
  private readonly logger = new Logger(SagaService.name);

  constructor(
    private readonly accountClient: AccountClientService,
    private readonly workspaceClient: WorkspaceClientService,
  ) {}

  // saga.service.ts - executeCreateUserSaga metodu

async executeCreateUserSaga(dto: CreateUserSagaDataDto): Promise<SagaResponseDto<{ account: AccountResponse; workspace: WorkspaceResponse }>> {
  const sagaId = uuidv4();
  const startTime = Date.now();
  const completedSteps: SagaStep[] = [];
  const compensatedSteps: SagaStep[] = [];

  let accountId: string | null = null;
  let workspaceId: string | null = null;

  try {
    // ========================
    // STEP 1: Create Account
    // ========================
    const accountStepStart = Date.now();
    this.logger.log(`[${sagaId}] Step 1: Creating account...`);
    
    const account: AccountResponse = await this.accountClient.createAccount({
      email: dto.account.email,
      name: dto.account.name,
      password: dto.account.password,
    });
    accountId = account.id;

    completedSteps.push({
      name: 'CREATE_ACCOUNT',
      order: 1,
      status: 'SUCCESS',
      service: 'account-service',
      endpoint: 'CreateAccount',
      resourceId: accountId || undefined,
      timestamps: {
        startedAt: new Date(accountStepStart),
        completedAt: new Date(),
        duration: Date.now() - accountStepStart,
      },
    });

    this.logger.log(`[${sagaId}] Account created: ${accountId}`);

    const workspaceStepStart = Date.now();
    this.logger.log(`[${sagaId}] Step 2: Creating workspace...`);
    
    if (!accountId) {
      throw new Error('Account ID is required for workspace creation');
    }
    
    const workspace: WorkspaceResponse = await this.workspaceClient.createWorkspace({
      accountId: accountId,
      name: dto.workspace.name,
    });
    workspaceId = workspace.id;

    completedSteps.push({
      name: 'CREATE_WORKSPACE',
      order: 2,
      status: 'SUCCESS',
      service: 'workspace-service',
      endpoint: 'CreateWorkspace',
      resourceId: workspaceId || undefined,
      timestamps: {
        startedAt: new Date(workspaceStepStart),
        completedAt: new Date(),
        duration: Date.now() - workspaceStepStart,
      },
    });

    this.logger.log(`[${sagaId}] Workspace created: ${workspaceId}`);

    // ========================
    // SUCCESS RESPONSE
    // ========================
    return {
      success: true,
      status: SagaStatus.COMPLETED,
      message: 'User and workspace created successfully',
      data: {
        account: account,
        workspace: workspace,
      },
      completedSteps,
      compensatedSteps: [],
      sagaId,
      timestamps: {
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration: Date.now() - startTime,
      },
    };

  } catch (error) {
    // ========================
    // FAILURE & COMPENSATION
    // ========================
    this.logger.error(`[${sagaId}] Saga failed, starting compensation...`, error);

    
    let failedStep: string;
    if (!accountId) {
      failedStep = 'CREATE_ACCOUNT';
    } else {
      failedStep = 'CREATE_WORKSPACE';
    }

    // Compensate Account
    if (accountId) {
      try {
        const compensateStart = Date.now();
        this.logger.log(`[${sagaId}] Compensating account: ${accountId}`);
        
        await this.accountClient.compensateAccount(accountId);
        
        compensatedSteps.push({
          name: 'COMPENSATE_ACCOUNT',
          order: 1,
          status: 'COMPENSATED',
          service: 'account-service',
          endpoint: 'CompensateAccount',
          resourceId: accountId,
          timestamps: {
            startedAt: new Date(compensateStart),
            completedAt: new Date(),
            duration: Date.now() - compensateStart,
          },
        });

        this.logger.log(`[${sagaId}] Account compensated successfully`);
      } catch (compensateError) {
        this.logger.error(`[${sagaId}] Account compensation failed`, compensateError);
      }
    }

    // ========================
    // FAILURE RESPONSE
    // ========================
    return {
      success: false,
      status: compensatedSteps.length > 0 ? SagaStatus.COMPENSATED : SagaStatus.FAILED,
      message: 'Saga failed and rolled back',
      error: {
        message: error.message,
        code: error.code || 'SAGA_EXECUTION_FAILED',
        failedStep,
        statusCode: error.status || 500,
        details: error.response?.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      data: undefined,
      completedSteps,
      compensatedSteps,
      sagaId,
      timestamps: {
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration: Date.now() - startTime,
      },
    };
  }
}
}