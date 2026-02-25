# Contributing

## Development flow

1. Create feature branch from main.
2. Keep commits small and atomic.
3. Run `npm run typecheck`, `npm run test -- --runInBand`, `npm run test:e2e -- --runInBand`.
4. Open PR using template.

## Code standards

- Prefer strict typing.
- Keep business logic in services.
- Avoid side effects in mappers.
- Never log secrets or raw PDF content.

## Security

- Validate all input.
- Keep dependencies updated.
- Review threat model changes in README.
