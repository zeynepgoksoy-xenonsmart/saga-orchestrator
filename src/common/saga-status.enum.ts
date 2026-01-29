// saga/enums/saga-status.enum.ts
export enum SagaStatus {
    PENDING = 'PENDING',           // Henüz başlamadı
    IN_PROGRESS = 'IN_PROGRESS',   // Devam ediyor
    COMPLETED = 'COMPLETED',       // Başarıyla tamamlandı
    FAILED = 'FAILED',             // Başarısız oldu
    COMPENSATING = 'COMPENSATING', // Compensation yapılıyor
    COMPENSATED = 'COMPENSATED',   // Compensation tamamlandı
    PARTIAL_FAILURE = 'PARTIAL_FAILURE' // Kısmi başarısız (bazı compensationlar başarısız)
  }