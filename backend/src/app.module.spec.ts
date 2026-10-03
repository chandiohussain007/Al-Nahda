import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';

describe('AppModule', () => {
  it('wires up the full application graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();

    await moduleRef.close();
  });
});
