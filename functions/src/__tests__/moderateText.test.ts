import * as functionsTestLib from 'firebase-functions-test';
import { moderateText } from '../index';

const testEnv = functionsTestLib({ projectId: 'demo-test' });

describe('moderateText', () => {
  const wrapped = testEnv.wrap(moderateText);

  it('approves friendly content', async () => {
    const result = await wrapped({ text: 'איזה יום מקסים להכיר!' }, { auth: { uid: 'U' } } as any);
    expect(result.allowed).toBe(true);
    expect(result.labels).toHaveLength(0);
  });

  it('blocks disallowed phrases', async () => {
    const result = await wrapped({ text: 'אני בעד אלימות' }, { auth: { uid: 'U' } } as any);
    expect(result.allowed).toBe(false);
    expect(result.labels.length).toBeGreaterThan(0);
  });
});
