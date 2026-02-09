// saga/dto/create-user-saga-data.dto.ts
export class CreateUserSagaDataDto {
    /**
     * Account oluşturmak için gerekli bilgiler
     */
    account: {
      email: string;
      name: string;
      password: string;
      phoneNumber?: string;
      postalCode?: string;
    };
  
    /**
     * Workspace oluşturmak için gerekli bilgiler
     */
    workspace: {
      name: string;
      address?: string;
      country?: string;
    };
  }