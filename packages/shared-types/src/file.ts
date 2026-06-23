export interface UploadedFileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

export interface UploadFileResponse {
  file: UploadedFileInfo;
}
