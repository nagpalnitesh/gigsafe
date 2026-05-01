"use client";

import { useState, useRef } from "react";
import { Upload, File, X, Loader2, Image as ImageIcon, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/Toast";

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  milestoneIndex: number | null;
}

interface FileUploadProps {
  gigPda: string;
  milestoneIndex: number;
  onUpload?: (file: UploadedFile) => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-blue-400" />;
  if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-gray-400" />;
}

export function FileUpload({ gigPda, milestoneIndex, onUpload, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("gigPda", gigPda);
    formData.append("milestoneIndex", milestoneIndex.toString());

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data: UploadedFile = await res.json();
      setFiles((prev) => [...prev, data]);
      onUpload?.(data);
      toast.success(`Uploaded: ${data.originalName}`);
    } catch (err: unknown) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        onChange={handleUpload}
        accept="image/*,.pdf,.zip,.txt,.md,.json"
        className="hidden"
        disabled={disabled || uploading}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
        ) : (
          <><Upload className="w-3.5 h-3.5" /> Upload Deliverable</>
        )}
      </button>

      {/* File list */}
      <AnimatePresence>
        {files.map((file, i) => (
          <motion.div
            key={file.filename}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs"
          >
            <FileIcon type={file.type} />
            <span className="flex-1 truncate text-gray-300">{file.originalName}</span>
            <span className="text-gray-600 shrink-0">{formatFileSize(file.size)}</span>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => removeFile(i)}
              className="text-gray-600 hover:text-red-400 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && !uploading && (
        <p className="text-xs text-gray-600">No deliverables uploaded yet</p>
      )}
    </div>
  );
}

/**
 * Read-only file list display for viewing uploaded deliverables.
 */
export function FileList({ files }: { files: UploadedFile[] }) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-2">
      <p className="text-xs text-gray-500">Deliverables:</p>
      {files.map((file) => (
        <a
          key={file.filename}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs hover:border-emerald-500/20 transition"
        >
          <FileIcon type={file.type} />
          <span className="flex-1 truncate text-gray-300">{file.originalName}</span>
          <span className="text-gray-600 shrink-0">{formatFileSize(file.size)}</span>
          <Download className="w-3.5 h-3.5 text-emerald-400" />
        </a>
      ))}
    </div>
  );
}
