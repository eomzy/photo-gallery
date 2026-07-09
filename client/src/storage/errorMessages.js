// Maps the semantic error codes thrown by tagsStore/photosStore to the
// Korean sentences shown in dialogs — mirrors what
// server/src/middleware/errorHandler.js used to do for the REST API.
const ERROR_MESSAGES = {
  TAG_NAME_TAKEN: '이미 사용 중인 태그 이름입니다. 다른 이름을 선택해주세요.',
  TAG_NOT_FOUND: '태그(폴더)를 찾을 수 없습니다.',
  NEED_AT_LEAST_TWO_SOURCE_TAGS: '병합하려면 서로 다른 폴더 2개 이상이 필요합니다.',
};

export function toFriendlyError(err) {
  return new Error(ERROR_MESSAGES[err.message] ?? err.message);
}
