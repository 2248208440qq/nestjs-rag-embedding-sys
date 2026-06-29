export const NUMBER_PATTERN = '[零一二三四五六七八九十百千万\\d]+';
export const ARTICLE_PATTERN = new RegExp(
  `^第${NUMBER_PATTERN}条(?=[\\s\\u3000])`,
  'gm',
);
export const HEADING_PATTERN = new RegExp(
  `^第${NUMBER_PATTERN}(编|章|节)[\\s\\u3000]*[^\\n]*`,
  'gm',
);
export const MAX_CHUNK_LENGTH = 900;
export const MIN_CHUNK_LENGTH = 120;

export type HeadingLevel = '章' | '节' | '编';
