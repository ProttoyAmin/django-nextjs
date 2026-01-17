import React from "react";

const FilePreview = ({ files, fieldName }: { files: FileList | File[] | null, fieldName: string }) => {
    if (!files || (Array.isArray(files) ? files.length === 0 : files.length === 0)) return null;

    const fileList = Array.isArray(files) ? files : Array.from(files);

    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm text-gray-600">Selected files:</p>
        <div className="space-y-1">
          {fileList.map((file, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs">📄</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

export default React.memo(FilePreview);