import { ProcessingStatus } from '@prisma/client';
import { InvoiceProcessingRepository } from '../../../src/modules/invoices/invoice-processing.repository';
import { InvoiceProcessingService } from '../../../src/modules/invoices/invoice-processing.service';

describe('InvoiceProcessingService', () => {
  let service: InvoiceProcessingService;
  let repository: jest.Mocked<InvoiceProcessingRepository>;

  beforeEach(() => {
    repository = {
      findByHash: jest.fn(),
      createReceived: jest.fn(),
      updateStatus: jest.fn(),
      resetForReprocessing: jest.fn(),
    } as unknown as jest.Mocked<InvoiceProcessingRepository>;

    service = new InvoiceProcessingService(repository);
  });

  it('markExtracted should persist raw/redacted payload for audit trail', async () => {
    await service.markExtracted('proc-1', {
      token: 'secret-token-value',
      sample: 'ok',
    });

    expect(repository.updateStatus).toHaveBeenCalledTimes(1);
    expect(repository.updateStatus).toHaveBeenCalledWith(
      'proc-1',
      ProcessingStatus.LLM_EXTRACTED,
      expect.objectContaining({
        rawLlmJson: {
          token: 'secret-token-value',
          sample: 'ok',
        },
        redactedLlmJson: {
          token: '[REDACTED]',
          sample: 'ok',
        },
      }),
    );
  });
});
