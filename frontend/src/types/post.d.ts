export interface PostFormType {
  content: string;
  media?: File[];
  visibility: 'public' | 'followers' | 'only_me';
  post_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
  is_public: boolean;
  post_destination?: 'profile' | 'club';
  selected_clubs?: string[];
}

export interface CommentForm {
  post_id: string | number;
  content: string;
}

export interface MediaFile {
  id: string | number;
  image_file?: string;
  image_url?: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  order?: number;
  video_file?: string;
  video_url?: string;
}

export interface PostType {
  id: string;
  url: string;
  author_id: number;
  author_username: string;
  author_avatar: string;
  author_url: string;
  club_id: string | null,
  club_name: string | null,
  club_url: string | null,
  title: string | null,
  is_pinned: boolean,
  post_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED',
  content: string | null,
  image: string | null,
  video: string | null,
  image_file: string | null,
  video_file: string | null,
  image_url: string | null,
  video_url: string | null,
  images: [
    {
      file: string | null,
      url: string | null
    }
  ],
  videos: [],
  media_files: MediaFile[],
  original_post: string | null,
  original_post_data: string | null,
  like_count: number,
  comment_count: number,
  share_count: number,
  repost_count: number,
  is_liked: boolean,
  is_owner: boolean,
  is_shared: boolean,
  can_edit: boolean,
  is_public: boolean,
  created_at: string,
  updated_at: string
}

export interface CreatePostRequest {
  post_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
  content?: string;
  image_file?: File;
  video_file?: File;
  image_url?: string;
  video_url?: string;
  is_public?: boolean;
  club_id?: string;
  original_post?: number;
}

export interface CreatePostResponse extends PostType {
  likes_url: string;
  comments_url: string;
  shares_url: string;
  like_toggle_url: string;
  share_toggle_url: string;
  repost_url: string;
}

export interface UploadResponse {
  temp_file_path: string;
  file_name: string;
  file_size: number;
  file_type: 'image' | 'video';
  message: string;
}
