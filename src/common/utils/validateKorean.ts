/**
 * @description 원본 텍스트에서 중복된 공백을 제거하고 500자 이하로 자름
 * @param rawText 원본 텍스트
 * @returns 500자 이하로 자른 텍스트
 */
export const extractText = (
  rawText: string,
  sliceLength: number = 500,
): string => {
  const text = rawText.trim().replace(/\s+/g, ' ');
  return text.slice(0, sliceLength);
};

/**
 * @description 텍스트가 한글인지 검증
 * @param text 텍스트
 * @returns 한글 여부
 */
export const isKorean = (text: string): boolean => {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
};
export const validateKorean = (text: string): boolean => {
  return isKorean(extractText(text));
};
