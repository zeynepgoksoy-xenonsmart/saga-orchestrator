// saga.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SagaService } from './saga.service';
import { CreateUserSagaDataDto } from './dto/create-user-saga.dto';

@Controller('saga')
export class SagaController {
  constructor(private readonly sagaService: SagaService) {}

  @Post('create-user')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserSagaDataDto) {
    return this.sagaService.executeCreateUserSaga(createUserDto);
  }
}