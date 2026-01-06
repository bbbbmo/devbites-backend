import { validateKorean } from './validateKorean';

describe('validateKorean', () => {
  it('should return true if the text is Korean', () => {
    expect(validateKorean('안녕하세요')).toBe(true);
  });
});
