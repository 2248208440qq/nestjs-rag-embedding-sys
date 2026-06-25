export { default as DocumentDetail } from './components/data/DocumentDetail.vue';
export { default as DocumentTable } from './components/data/DocumentTable.vue';
export { default as FileUpload } from './components/forms/FileUpload.vue';
export { default as SearchBar } from './components/search/SearchBar.vue';
export { default as SearchResultList } from './components/search/SearchResultList.vue';
export { default as SourceTypeTag } from './components/tags/SourceTypeTag.vue';
export { default as StatusTag } from './components/tags/StatusTag.vue';

export {
  documentSourceTypeConfig,
  documentStatusConfig,
  getDocumentSourceTypeConfig,
  getDocumentStatusConfig,
} from './utils/documentMeta';
export type { DocumentMetaConfig, ElementTagType } from './utils/documentMeta';
