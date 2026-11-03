/**
 * Test-only utility: registers a lightweight token accessor with the Axios
 * instance so the request interceptor can attach a JWT without needing the
 * real <ApiConnector> React component to be rendered.
 *
 * Usage in test files:
 *   import { registerTestTokenAccessor } from '@/lib/__mocks__/apiConnectorMock';
 *   registerTestTokenAccessor();
 */
import { registerTokenAccessor } from '../api';
import { readSession } from '../session';

export function registerTestTokenAccessor() {
  registerTokenAccessor(
    // getter: read the current token straight from localStorage (via session)
    () => readSession()?.accessToken ?? null,
    // refresher: no real refresh in tests — just return null
    async () => null,
  );
}
