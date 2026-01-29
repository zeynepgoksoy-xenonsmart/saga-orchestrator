// saga/types/saga-step.type.ts
export type SagaStep = {
    /**
     * Adım adı
     */
    name: string;
  
    /**
     * Adım sırası
     */
    order: number;
  
    /**
     * Adımın durumu
     */
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'COMPENSATED';
  
    /**
     * Hangi servise yapıldı
     */
    service: string;
  
    /**
     * Endpoint
     */
    endpoint: string;
  
    /**
     * Oluşturulan resource ID
     */
    resourceId?: string;
  
    /**
     * Adım zamanlamaları
     */
    timestamps: {
      startedAt: Date;
      completedAt: Date;
      duration: number; // milliseconds
    };
  
    /**
     * Hata detayı (varsa)
     */
    error?: string;
  };