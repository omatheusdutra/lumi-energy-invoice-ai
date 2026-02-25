import { MODULE_METADATA } from '@nestjs/common/constants';

describe('AppModule', () => {
  it('is defined and declares imports/providers metadata', async () => {
    let AppModuleRef: unknown;

    await jest.isolateModulesAsync(async () => {
      jest.doMock('../../src/common/banner/startup-banner.service', () => ({
        StartupBannerService: class StartupBannerServiceMock {},
      }));

      const moduleRef = await import('../../src/app.module');
      AppModuleRef = moduleRef.AppModule;
    });

    expect(AppModuleRef).toBeDefined();

    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModuleRef) as unknown[];
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModuleRef) as unknown[];

    expect(Array.isArray(imports)).toBe(true);
    expect(Array.isArray(providers)).toBe(true);
    expect(imports.length).toBeGreaterThan(0);
    expect(providers.length).toBeGreaterThan(0);
  });
});
