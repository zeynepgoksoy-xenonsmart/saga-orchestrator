// saga.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AccountClientService } from '../clients/account-client.service';
import { WorkspaceClientService } from '../clients/workspace-client.service';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { SagaStep } from './types/saga-step.type';
import { SagaResponseDto } from './dto/saga-response.dto';
import { CreateUserSagaDataDto } from './dto/create-user-saga.dto';
import { SagaStatus } from '../common/saga-status.enum';
import type { AccountResponse } from '../../../proto/generated/account';
import type { WorkspaceResponse } from '../../../proto/generated/workspace';

type PersistedSagaStep = Omit<SagaStep, 'timestamps'> & {
  timestamps: {
    startedAt: string;
    completedAt: string;
    duration: number;
  };
};

function toPersistedSagaStep(step: SagaStep): PersistedSagaStep {
  return {
    ...step,
    timestamps: {
      startedAt: step.timestamps.startedAt.toISOString(),
      completedAt: step.timestamps.completedAt.toISOString(),
      duration: step.timestamps.duration,
    },
  };
}

@Injectable()
export class SagaService {
  private readonly logger = new Logger(SagaService.name);

  constructor(
    private readonly accountClient: AccountClientService,
    private readonly workspaceClient: WorkspaceClientService,
    private readonly prisma: PrismaService,
  ) {}

  // saga.service.ts - executeCreateUserSaga metodu

async executeCreateUserSaga(dto: CreateUserSagaDataDto): Promise<SagaResponseDto<{ account: AccountResponse; workspace: WorkspaceResponse }>> {
  const sagaId = uuidv4();
  const startTime = Date.now();
  const completedSteps: SagaStep[] = [];
  const compensatedSteps: SagaStep[] = [];

  let accountId: string | null = null;
  let workspaceId: string | null = null;
  // Track step metadata rows so we can mark them FAILED if an exception happens mid-step
  let createAccountStepMetaId: string | null = null;
  let createWorkspaceStepMetaId: string | null = null;
  let sagaExecutionCreated = false;

  // ========================
  // SAGA EXECUTION (PERSIST) - EN BAŞTA OLUŞTUR
  // ========================
  try {
    await this.prisma.sagaExecution.create({
      data: {
        sagaId,
        sagaType: 'CREATE_USER',
        status: SagaStatus.IN_PROGRESS,
        inputData: dto as any,
        completedSteps: [] as any,
        compensatedSteps: [] as any,
        currentStep: 'CREATE_ACCOUNT',
        userId: dto.account.email,
      },
    });
    sagaExecutionCreated = true;
    this.logger.log(`[${sagaId}] Saga execution created in database`);
  } catch (createErr) {
    this.logger.error(`[${sagaId}] Failed to create saga execution record`, createErr);
    // Devam et, ama sagaId DB'de olmayacak
  }

  try {

    // ========================
    // STEP 1: Create Account
    // ========================
    const accountStepStart = Date.now();
    this.logger.log(`[${sagaId}] Step 1: Creating account...`);

    const createAccountStepMeta = await this.prisma.sagaStepMetadata.create({
      data: {
        sagaId,
        stepName: 'CREATE_ACCOUNT',
        stepOrder: 1,
        status: SagaStatus.IN_PROGRESS,
        serviceName: 'account-service',
        resourceType: 'Account',
        requestPayload: {
          email: dto.account.email,
          name: dto.account.name,
          phoneNumber: dto.account.phoneNumber,
          postalCode: dto.account.postalCode,
        } as any,
        startedAt: new Date(accountStepStart),
      },
    });
    createAccountStepMetaId = createAccountStepMeta.id;
    
    const account: AccountResponse = await this.accountClient.createAccount({
      email: dto.account.email,
      name: dto.account.name,
      password: dto.account.password,
      phoneNumber: dto.account.phoneNumber,
      postalCode: dto.account.postalCode,
    });
    accountId = account.id;

    await this.prisma.sagaStepMetadata.update({
      where: { id: createAccountStepMetaId },
      data: {
        status: SagaStatus.COMPLETED,
        resourceId: accountId,
        responsePayload: account as any,
        completedAt: new Date(),
        duration: Date.now() - accountStepStart,
      },
    });

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

    await this.prisma.sagaExecution.update({
      where: { sagaId },
      data: {
        completedSteps: completedSteps.map(toPersistedSagaStep) as any,
        currentStep: 'CREATE_WORKSPACE',
      },
    });

    this.logger.log(`[${sagaId}] Account created: ${accountId}`);

    const workspaceStepStart = Date.now();
    this.logger.log(`[${sagaId}] Step 2: Creating workspace...`);
    
    if (!accountId) {
      throw new Error('Account ID is required for workspace creation');
    }

    const createWorkspaceStepMeta = await this.prisma.sagaStepMetadata.create({
      data: {
        sagaId,
        stepName: 'CREATE_WORKSPACE',
        stepOrder: 2,
        status: SagaStatus.IN_PROGRESS,
        serviceName: 'workspace-service',
        resourceType: 'Workspace',
        requestPayload: {
          ownerId: accountId,
          name: dto.workspace.name,
          address: dto.workspace.address,
          country: dto.workspace.country,
        } as any,
        startedAt: new Date(workspaceStepStart),
      },
    });
    createWorkspaceStepMetaId = createWorkspaceStepMeta.id;
    
    const workspace: WorkspaceResponse = await this.workspaceClient.createWorkspace({
      accountId: accountId,
      name: dto.workspace.name,
      address: dto.workspace.address,
      country: dto.workspace.country,
    });
    workspaceId = workspace.id;

    await this.prisma.sagaStepMetadata.update({
      where: { id: createWorkspaceStepMetaId },
      data: {
        status: SagaStatus.COMPLETED,
        resourceId: workspaceId,
        responsePayload: workspace as any,
        completedAt: new Date(),
        duration: Date.now() - workspaceStepStart,
      },
    });

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

    await this.prisma.sagaExecution.update({
      where: { sagaId },
      data: {
        status: SagaStatus.COMPLETED,
        completedSteps: completedSteps.map(toPersistedSagaStep) as any,
        currentStep: null,
        completedAt: new Date(),
        outputData: {
          accountId,
          workspaceId,
        } as any,
      },
    });

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

    // Mark the in-flight step as FAILED (best-effort)
    if (sagaExecutionCreated) {
      try {
        if (!accountId && createAccountStepMetaId) {
          await this.prisma.sagaStepMetadata.update({
            where: { id: createAccountStepMetaId },
            data: {
              status: SagaStatus.FAILED,
              errorMessage: (error as any)?.message ?? 'Unknown error',
              completedAt: new Date(),
            },
          });
          this.logger.log(`[${sagaId}] Marked CREATE_ACCOUNT step as FAILED in database`);
        }
        if (accountId && createWorkspaceStepMetaId) {
          await this.prisma.sagaStepMetadata.update({
            where: { id: createWorkspaceStepMetaId },
            data: {
              status: SagaStatus.FAILED,
              errorMessage: (error as any)?.message ?? 'Unknown error',
              completedAt: new Date(),
            },
          });
          this.logger.log(`[${sagaId}] Marked CREATE_WORKSPACE step as FAILED in database`);
        }
      } catch (persistStepErr) {
        this.logger.error(`[${sagaId}] Failed to persist FAILED step metadata`, persistStepErr);
      }
    } else {
      this.logger.warn(`[${sagaId}] Cannot update step metadata - saga execution was never created in DB`);
    }

    // Persist saga as FAILED -> COMPENSATING (best-effort)
    if (sagaExecutionCreated) {
      try {
        await this.prisma.sagaExecution.update({
          where: { sagaId },
          data: {
            status: SagaStatus.FAILED,
            completedSteps: completedSteps.map(toPersistedSagaStep) as any,
            currentStep: failedStep,
            errorMessage: (error as any)?.message ?? 'Unknown error',
            errorCode: (error as any)?.code ? String((error as any).code) : 'SAGA_EXECUTION_FAILED',
            errorStack: process.env.NODE_ENV === 'development' ? (error as any)?.stack : undefined,
          },
        });
        this.logger.log(`[${sagaId}] Updated saga execution status to FAILED in database`);
      } catch (persistSagaErr) {
        this.logger.error(`[${sagaId}] Failed to persist saga execution (FAILED)`, persistSagaErr);
        this.logger.error(`[${sagaId}] Error details:`, {
          message: (persistSagaErr as any)?.message,
          code: (persistSagaErr as any)?.code,
          stack: (persistSagaErr as any)?.stack,
        });
      }
    } else {
      this.logger.warn(`[${sagaId}] Cannot update saga execution - record was never created in DB`);
    }

    // Compensate Account
    if (accountId) {
      try {
        const compensateStart = Date.now();
        this.logger.log(`[${sagaId}] Compensating account: ${accountId}`);

        // best-effort: persist COMPENSATING
        if (sagaExecutionCreated) {
          try {
            await this.prisma.sagaExecution.update({
              where: { sagaId },
              data: {
                status: SagaStatus.COMPENSATING,
                compensatedSteps: compensatedSteps.map(toPersistedSagaStep) as any,
                currentStep: 'COMPENSATE_ACCOUNT',
              },
            });
            this.logger.log(`[${sagaId}] Updated saga execution status to COMPENSATING in database`);
          } catch (persistCompensatingErr) {
            this.logger.error(`[${sagaId}] Failed to persist saga execution (COMPENSATING)`, persistCompensatingErr);
          }
        }

        let compensateStepMetaId: string | null = null;
        if (sagaExecutionCreated) {
          try {
            const compensateStepMeta = await this.prisma.sagaStepMetadata.create({
              data: {
                sagaId,
                stepName: 'COMPENSATE_ACCOUNT',
                stepOrder: 1,
                status: SagaStatus.IN_PROGRESS,
                serviceName: 'account-service',
                resourceType: 'Account',
                resourceId: accountId,
                startedAt: new Date(compensateStart),
              },
            });
            compensateStepMetaId = compensateStepMeta.id;
            this.logger.log(`[${sagaId}] Created COMPENSATE_ACCOUNT step metadata in database`);
          } catch (createStepErr) {
            this.logger.error(`[${sagaId}] Failed to create compensation step metadata`, createStepErr);
          }
        }
        
        await this.accountClient.compensateAccount(accountId);
        
        compensatedSteps.push({
          name: 'COMPENSATE_ACCOUNT',
          order: 1,
          status: SagaStatus.COMPENSATED,
          service: 'account-service',
          endpoint: 'CompensateAccount',
          resourceId: accountId,
          timestamps: {
            startedAt: new Date(compensateStart),
            completedAt: new Date(),
            duration: Date.now() - compensateStart,
          },
        });

        if (sagaExecutionCreated && compensateStepMetaId) {
          try {
            await this.prisma.sagaStepMetadata.update({
              where: { id: compensateStepMetaId },
              data: {
                status: SagaStatus.COMPENSATED,
                completedAt: new Date(),
                duration: Date.now() - compensateStart,
              },
            });
            this.logger.log(`[${sagaId}] Updated COMPENSATE_ACCOUNT step to COMPENSATED in database`);
          } catch (updateStepErr) {
            this.logger.error(`[${sagaId}] Failed to update compensation step metadata`, updateStepErr);
          }
        }

        if (sagaExecutionCreated) {
          try {
            await this.prisma.sagaExecution.update({
              where: { sagaId },
              data: {
                status: SagaStatus.COMPENSATED,
                completedSteps: completedSteps.map(toPersistedSagaStep) as any,
                compensatedSteps: compensatedSteps.map(toPersistedSagaStep) as any,
                currentStep: null,
                completedAt: new Date(),
              },
            });
            this.logger.log(`[${sagaId}] Updated saga execution status to COMPENSATED in database`);
          } catch (persistCompensatedErr) {
            this.logger.error(`[${sagaId}] Failed to persist saga execution (COMPENSATED)`, persistCompensatedErr);
            this.logger.error(`[${sagaId}] Error details:`, {
              message: (persistCompensatedErr as any)?.message,
              code: (persistCompensatedErr as any)?.code,
              stack: (persistCompensatedErr as any)?.stack,
            });
          }
        }

        this.logger.log(`[${sagaId}] Account compensated successfully`);
      } catch (compensateError) {
        this.logger.error(`[${sagaId}] Account compensation failed`, compensateError);
        if (sagaExecutionCreated) {
          try {
            await this.prisma.sagaExecution.update({
              where: { sagaId },
              data: {
                status: SagaStatus.PARTIAL_FAILURE,
                errorMessage: (compensateError as any)?.message ?? 'Account compensation failed',
              },
            });
            this.logger.log(`[${sagaId}] Updated saga execution status to PARTIAL_FAILURE in database`);
          } catch (persistPartialErr) {
            this.logger.error(`[${sagaId}] Failed to persist saga execution (PARTIAL_FAILURE)`, persistPartialErr);
          }
        }
      }
    }

    // If we never compensated anything, keep the FAILED status persisted
    if (!accountId && sagaExecutionCreated) {
      try {
        await this.prisma.sagaExecution.update({
          where: { sagaId },
          data: {
            status: SagaStatus.FAILED,
            completedSteps: completedSteps.map(toPersistedSagaStep) as any,
            compensatedSteps: compensatedSteps.map(toPersistedSagaStep) as any,
            completedAt: new Date(),
          },
        });
        this.logger.log(`[${sagaId}] Updated saga execution status to FAILED (final) in database`);
      } catch (persistFailedFinalErr) {
        this.logger.error(`[${sagaId}] Failed to persist saga execution (FAILED final)`, persistFailedFinalErr);
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