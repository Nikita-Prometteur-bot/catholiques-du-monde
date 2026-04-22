export type Content = {
  id: number;
  title: string;
  description?: string;
  type: 'image' | 'text' | 'video' | 'audio';
  contentUrl: string;
  startTime: string;
  endTime: string;
  isDownloadable: boolean;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
};
