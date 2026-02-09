// clients/workspace-client.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  WorkspaceServiceClient,
  CreateWorkspaceRequest,
  CompensateWorkspaceRequest,
  WorkspaceResponse,
} from '../../../proto/generated/workspace';

@Injectable()
export class WorkspaceClientService implements OnModuleInit {
  private workspaceService: WorkspaceServiceClient;

  constructor(@Inject('WORKSPACE_GRPC') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.workspaceService = this.client.getService<WorkspaceServiceClient>('WorkspaceService');
  }

  async createWorkspace(data: { accountId: string; name: string; address?: string; country?: string }): Promise<WorkspaceResponse> {
    const request: CreateWorkspaceRequest = {
      name: data.name,
      ownerId: data.accountId,
      address: data.address,
      country: data.country,
    };
    return firstValueFrom(this.workspaceService.CreateWorkspace(request));
  }

  async compensateWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
    const request: CompensateWorkspaceRequest = { workspaceId };
    return firstValueFrom(this.workspaceService.CompensateWorkspace(request));
  }
}