import { SagaStatus } from "src/common/saga-status.enum";
import { SagaErrorDto } from "./saga-error.dto";
import { SagaStep } from "src/saga/types/saga-step.type";


export class SagaResponseDto<T = any> {
  /**
   * Saga işleminin başarılı olup olmadığı
   */
  success: boolean;

  /**
   * Saga'nın mevcut durumu
   */
  status: SagaStatus;

  /**
   * İnsan okunabilir mesaj
   */
  message: string;

  /**
   * Saga işleminden dönen data
   */
  data?: T;

  /**
   * Hata detayları (başarısızlık durumunda)
   */
  error?: SagaErrorDto;

  /**
   * Saga'nın tamamlanan adımları
   */
  completedSteps: SagaStep[];

  /**
   * Compensation yapılan adımlar
   */
  compensatedSteps: SagaStep[];

  /**
   * Saga execution ID (tracking için)
   */
  sagaId: string;

  /**
   * İşlem zamanlamaları
   */
  timestamps: {
    startedAt: Date;
    completedAt?: Date;
    duration?: number; // milliseconds
  };
}