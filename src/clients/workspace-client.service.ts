// clients/workspace-client.service.ts
import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WorkspaceClientService {
  private readonly workspaceServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.workspaceServiceUrl = 
      this.configService.get('WORKSPACE_SERVICE_URL') || 'http://localhost:3004';
  }

  async createWorkspace(data: { accountId: string; name: string }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.workspaceServiceUrl}/workspaces`, {
          ownerId: data.accountId,
          name: data.name,
        })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create workspace',
        error.response?.status || 500,
      );
    }
  }

  async compensateWorkspace(workspaceId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.workspaceServiceUrl}/workspaces/${workspaceId}/compensate`
        )
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to compensate workspace',
        error.response?.status || 500,
      );
    }
  }
}