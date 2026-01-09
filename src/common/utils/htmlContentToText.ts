import { htmlToText } from 'html-to-text';

const formatText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // 연속 공백을 하나로
    .replace(/\n\s*\n/g, '\n\n'); // 문단 구분은 유지
};

export const htmlContentToText = (htmlContent: string): string => {
  const convertedText = htmlToText(htmlContent, {
    wordwrap: false, // 줄 강제 개행 방지
    selectors: [
      { selector: 'img', format: 'skip' }, // 이미지 제거
      { selector: 'video', format: 'skip' }, // 비디오 제거
      { selector: 'figure', format: 'skip' },
    ],
  });

  const cleanedText = formatText(convertedText);

  return cleanedText;
};
