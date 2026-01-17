// import type { UserType } from "@/types";

// export function mapUserResponse(apiData: any): UserType {
//   return {
//     id: apiData.id,
//     username: apiData.username,
//     first_name: apiData.first_name,
//     last_name: apiData.last_name,
//     email: apiData.email,
//     edu_mail: apiData.edu_mail,
//     url: apiData.url,
//     student_id: apiData.student_id,
//     department: apiData.department,
//     year: apiData.year,
//     level: apiData.level,

//     profile_picture_url: apiData.profile_picture_url || apiData.avatar || null,
//     avatar: apiData.avatar || null,
//     bio: apiData.bio ?? "",
//     location: apiData.location,
//     website: apiData.website,
//     date_of_birth: apiData.date_of_birth,
//     email_verified: apiData.email_verified,
//     is_private: apiData.is_private,

//     club_count: apiData.club_count ?? apiData.clubs?.length ?? 0,
//     clubs: apiData.clubs || [],
//     clubs_url: apiData.clubs_url,

//     interactions: {
//       likes_given: apiData.likes_given ?? 0,
//       comments_made: apiData.comments_made ?? 0,
//       shares_made: apiData.shares_made ?? 0,
//       likes_received: apiData.likes_received ?? 0,
//       user_post_count: apiData.user_post_count ?? 0,
//       club_post_count: apiData.club_post_count ?? 0,
//       total_posts_count: apiData.total_posts_count ?? 0,
//     },

//     connections: {
//       follower_count: apiData.follower_count ?? 0,
//       following_count: apiData.following_count ?? 0,
//       is_following: apiData.is_following ?? false,
//       is_followed_by: apiData.is_followed_by ?? false,
//       is_mutual: apiData.is_mutual ?? false,
//       follow_status: apiData.follow_status ?? null,
//       followers_url: apiData.followers_url,
//       following_url: apiData.following_url,
//     },

//     can_view_profile: apiData.can_view_profile ?? true,
//     last_active: apiData.last_active,
//     created_at: apiData.created_at,
//     updated_at: apiData.updated_at,
//     last_login: apiData.last_login,
//   };
// }
