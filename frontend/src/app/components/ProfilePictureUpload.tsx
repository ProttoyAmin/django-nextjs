// // app/components/ProfilePictureUpload.tsx
// 'use client'
// import { useState } from 'react';
// import { uploadProfilePicture } from '@/src/libs/auth/auth';
// import Image from 'next/image';

// interface ProfilePictureUploadProps {
//   currentPicture?: string;
//   onUploadSuccess: (newPictureUrl: string) => void;
// }

// export default function ProfilePictureUpload({
//   currentPicture,
//   onUploadSuccess
// }: ProfilePictureUploadProps) {
//   const [isUploading, setIsUploading] = useState(false);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];

//     if (!file) return;

//     if (!file.type.startsWith('image/')) {
//       setError('Please select an image file');
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       setError('Image must be less than 5MB');
//       return;
//     }

//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setPreview(reader.result as string);
//     };
//     reader.readAsDataURL(file);

//     setIsUploading(true);
//     setError(null);

//     try {
//       const result = await uploadProfilePicture(file);

//       if (result.success) {
//         onUploadSuccess(result.data.profile_picture_url);
//         setError(null);
//       } else {
//         setError(result.errors?.detail || 'Upload failed');
//         setPreview(null);
//       }
//     } catch (err) {
//       setError('Upload failed');
//       setPreview(null);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const displayPicture = preview || currentPicture;

//   return (
//     <div className="flex flex-col items-center space-y-4">
//       {/* Profile Picture Display */}
//       <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-700">
//         {displayPicture ? (
//           <Image
//             src={displayPicture}
//             alt="Profile"
//             fill
//             className="object-cover"
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
//             👤
//           </div>
//         )}
//       </div>

//       {/* Upload Button */}
//       <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
//         {isUploading ? 'Uploading...' : 'Change Picture'}
//         <input
//           type="file"
//           accept="image/*"
//           onChange={handleFileChange}
//           disabled={isUploading}
//           className="hidden"
//         />
//       </label>

//       {/* Error Message */}
//       {error && (
//         <p className="text-red-500 text-sm">{error}</p>
//       )}
//     </div>
//   );
// }