// saga/dto/saga-error.dto.ts
export class SagaErrorDto {
    /**
     * Hata mesajı
     */
    message: string;
  
    /**
     * Hata kodu
     */
    code?: string;
  
    /**
     * Hangi adımda hata oluştu
     */
    failedStep?: string;
  
    /**
     * HTTP status code
     */
    statusCode?: number;
  
    /**
     * Detaylı hata bilgisi
     */
    details?: any;
  
    /**
     * Stack trace (development için)
     */
    stack?: string;
  }