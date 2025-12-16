import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'uploading' | 'processing' | 'ready';
}

export default function ChatbotData() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatbotName = searchParams.get('name') || '';

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!chatbotName) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">No Chatbot Selected</h2>
            <p className="text-muted-foreground">Please select a chatbot from the Data page first.</p>
            <Button onClick={() => navigate('/data')}>Go to Data</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.type === 'text/plain'
    );

    if (droppedFiles.length === 0) {
      toast.error('Please upload PDF or TXT files only');
      return;
    }

    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = async (newFiles: File[]) => {
    const fileObjects: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: formatFileSize(file.size),
      status: 'uploading' as const,
    }));

    setFiles(prev => [...prev, ...fileObjects]);

    for (const fileObj of fileObjects) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setFiles(prev =>
        prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'ready' as const } : f
        )
      );
    }

    toast.success(`${newFiles.length} file(s) uploaded`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };



  const handleProcessData = async () => {
    if (files.length === 0) {
      toast.error('Please upload some files first');
      return;
    }

    setIsProcessing(true);
    setFiles(prev => prev.map(f => ({ ...f, status: 'processing' as const })));

    await new Promise(resolve => setTimeout(resolve, 2500));

    setFiles(prev => prev.map(f => ({ ...f, status: 'ready' as const })));
    setIsProcessing(false);
    toast.success(`Data added to "${chatbotName}" successfully!`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Data</h1>
            <p className="text-muted-foreground">
              Adding data to: <span className="font-semibold text-foreground">{chatbotName}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/data')}>
            Back to Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* File Upload */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Files
              </CardTitle>
              <CardDescription>PDF or TXT files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-foreground bg-secondary"
                    : "border-border hover:border-foreground/50 hover:bg-secondary/50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  isDragging ? "text-foreground" : "text-muted-foreground"
                )} />
                <p className="text-sm text-muted-foreground">
                  Drop files here or click to browse
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {file.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {file.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-foreground" />}
                        {file.status === 'ready' && <CheckCircle className="w-4 h-4 text-success" />}
                        <button onClick={() => removeFile(file.id)} className="p-1 hover:bg-background rounded">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        {/* Process Button */}
        <Button
          size="lg"
          onClick={handleProcessData}
          disabled={isProcessing || files.length === 0}
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            'Process & Add Data'
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}