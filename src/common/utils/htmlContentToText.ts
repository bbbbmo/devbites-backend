import { htmlToText } from 'html-to-text';

export const htmlContentToText = (htmlContent: string): string => {
  const formattedText = htmlToText(htmlContent, {
    wordwrap: false, // 줄 강제 개행 방지
    selectors: [
      { selector: 'img', format: 'skip' }, // 이미지 제거
      { selector: 'video', format: 'skip' }, // 비디오 제거
      { selector: 'figure', format: 'skip' },
    ],
  });

  return formattedText;
};
