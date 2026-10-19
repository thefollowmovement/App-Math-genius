import { CHILD_MESSAGE_MAX_LENGTH, childMessageSchema } from './notifications';

describe('child messages', () => {
  it('are trimmed, not empty and short', () => {
    expect(childMessageSchema.parse('  À ta séance !  ')).toBe('À ta séance !');
    expect(childMessageSchema.safeParse('   ').success).toBe(false);
    expect(childMessageSchema.safeParse('a'.repeat(CHILD_MESSAGE_MAX_LENGTH + 1)).success).toBe(
      false,
    );
  });
});
