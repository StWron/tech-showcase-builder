/**
 * 산출물 위생 헬퍼.
 *
 * 블록 정의와 문서 조립부가 함께 쓰므로 순환 참조를 피해 따로 둔다.
 */

export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** <script type="application/json"> 안에 안전하게 넣기 위한 직렬화 */
export const escapeJsonForScript = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const IMAGE_DATA_URI = /^data:image\/(png|jpe?g|gif|webp);base64,/i;

/**
 * javascript:, vbscript:, data:text/html 등이 산출물로 새어 나가지 않게 한다.
 * http/https, 프로토콜 상대, 상대 경로만 통과. 이미지에 한해 base64 데이터 URI 허용.
 */
export const sanitizeUrl = (raw: string, options: { allowDataImage?: boolean } = {}): string => {
  const value = String(raw ?? '').trim();
  if (!value) return '';

  const schemeMatch = value.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === 'http' || scheme === 'https') return value;
    if (options.allowDataImage && IMAGE_DATA_URI.test(value)) return value;
    return '';
  }

  // 스킴 없음 = 상대 경로 또는 프로토콜 상대 URL
  return value;
};

/** 스킴이 명시된 절대 URL만 통과. 제어 엔드포인트처럼 대상이 분명해야 하는 곳에 쓴다. */
export const sanitizeAbsoluteUrl = (raw: string): string => {
  const value = String(raw ?? '').trim();
  return /^https?:\/\//i.test(value) ? value : '';
};
