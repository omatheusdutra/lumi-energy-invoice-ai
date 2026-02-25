import { BadGatewayException, UnprocessableEntityException } from '@nestjs/common';

export class LlmProviderException extends BadGatewayException {
  constructor(message = 'Failed to process document in LLM provider') {
    super(message);
  }
}

export class LlmSchemaValidationException extends UnprocessableEntityException {
  constructor(message = 'LLM returned invalid JSON') {
    super(message);
  }
}
