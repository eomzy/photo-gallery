import { ConflictError, NotFoundError, BadRequestError } from '../services/tags.service.js';

const ERROR_MESSAGES = {
  TAG_NAME_TAKEN: '이미 사용 중인 태그 이름입니다. 다른 이름을 선택해주세요.',
  TAG_NOT_FOUND: '태그(폴더)를 찾을 수 없습니다.',
  NEED_AT_LEAST_TWO_SOURCE_TAGS: '병합하려면 서로 다른 폴더 2개 이상이 필요합니다.',
  IMAGE_ONLY: '이미지 파일만 업로드할 수 있습니다.',
};

export function errorHandler(err, req, res, _next) {
  const message = ERROR_MESSAGES[err.message] ?? err.message ?? 'INTERNAL_ERROR';

  if (err instanceof ConflictError) return res.status(409).json({ error: err.message, message });
  if (err instanceof NotFoundError) return res.status(404).json({ error: err.message, message });
  if (err instanceof BadRequestError) return res.status(400).json({ error: err.message, message });
  if (err.message === 'IMAGE_ONLY') return res.status(400).json({ error: err.message, message });

  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
}
