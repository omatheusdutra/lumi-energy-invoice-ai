import { AlertsController } from '../../../src/modules/alerts/alerts.controller';

describe('AlertsController', () => {
  it('delegates list query to AlertsService', async () => {
    const listAlerts = jest.fn(async () => ({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    }));
    const controller = new AlertsController({ listAlerts } as any);
    const query = { numero_cliente: '3001116735', page: 1, pageSize: 20 };

    const result = await controller.listAlerts(query as any);

    expect(listAlerts).toHaveBeenCalledWith(query);
    expect(result.total).toBe(0);
  });
});
