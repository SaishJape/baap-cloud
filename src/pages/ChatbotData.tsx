import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { chatbotService, Chatbot } from '@/services/chatbotService';
import { API_BASE_URL } from '@/services/api';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

export default function ChatbotData() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId, clientId } = useAuth();
  // We can trust the ID mostly, but fetching fresh details is better
  const chatbotId = searchParams.get('id');

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loadingChatbot, setLoadingChatbot] = useState(true);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatbotId) {
      toast.error("Chatbot ID missing.");
      navigate('/dashboard');
      return;
    }
    fetchChatbotDetails();
  }, [chatbotId, navigate]);

  const fetchChatbotDetails = async () => {
    if (!userId || !clientId) return;
    try {
      setLoadingChatbot(true);
      const response = await chatbotService.getChatbot(chatbotId!);
      if (response.success) {
        setChatbot(response.data);
      }
    } catch (error) {
      console.error("Failed to load chatbot details", error);
      toast.error("Failed to load chatbot details");
    } finally {
      setLoadingChatbot(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );

    if (droppedFiles.length === 0) {
      toast.error('Please upload PDF files only');
      return;
    }

    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const fileObjects: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file: file,
      name: file.name,
      size: formatFileSize(file.size),
      status: 'ready', // Ready to be processed/uploaded
    }));

    setFiles(prev => [...prev, ...fileObjects]);
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

    if (!chatbot) return;

    // Use chatbot.config_id directly as it's cleaner than localStorage here, 
    // although localStorage is a safe fallback if we trust the flow.
    // The API requires config_id for upload.
    const configId = chatbot.config_id || localStorage.getItem('config_id');

    if (!configId) {
      toast.error("Config ID missing. Please configure settings.");
      return;
    }

    setIsProcessing(true);

    // Upload files one by one
    for (const fileObj of files) {
      if (fileObj.status === 'ready' || fileObj.status === 'error') {
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading' } : f));

        try {
          await chatbotService.uploadDocument(fileObj.file, chatbotId!, configId);
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'ready' } : f));
          toast.success(`Uploaded ${fileObj.name}`);
        } catch (error) {
          console.error("Upload failed", error);
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
          toast.error(`Failed to upload ${fileObj.name}`);
        }
      }
    }

    setIsProcessing(false);
  };

  if (loadingChatbot) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!chatbot) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Chatbot Not Found</h2>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{chatbot.title}</h1>
              <Badge variant={chatbot.status === 'ready' ? 'default' : 'secondary'} className={chatbot.status === 'ready' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                {chatbot.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              ID: <span className="font-mono text-xs">{chatbot.id}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* File Upload */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Knowledge
              </CardTitle>
              <CardDescription>Upload PDF documents to train your chatbot</CardDescription>
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
                  accept=".pdf"
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
                        {file.status === 'ready' && <CheckCircle className="w-4 h-4 text-success" />}
                        {file.status === 'error' && <X className="w-4 h-4 text-destructive" />}

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

          <div className="space-y-6">
            {/* Config & Info Card */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Configuration & Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Source Type</p>
                    <p className="font-medium">{chatbot.source_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Created At</p>
                    <p className="font-medium">{new Date(chatbot.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">Config ID</p>
                    <p className="font-mono bg-secondary p-1 rounded text-xs break-all">{chatbot.config_id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Embed Code Card */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg">Integrate Chatbot</CardTitle>
                <CardDescription>Copy this code to embed the chatbot on your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary p-4 rounded-lg relative group">
                  <code className="text-sm break-all font-mono block">
                    {`<iframe src="${API_BASE_URL}/chatbot/iframe/${chatbot.id}" width="400" height="600" style="border:none; position:fixed; bottom:20px; right:20px; z-index:9999;"></iframe>`}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe src="${API_BASE_URL}/chatbot/iframe/${chatbot.id}" width="400" height="600" style="border:none; position:fixed; bottom:20px; right:20px; z-index:9999;"></iframe>`);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Section */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-dashed border-gray-300 rounded-lg p-4 min-h-[400px] flex items-center justify-center bg-gray-50">
              <iframe
                src={`${API_BASE_URL}/chatbot/iframe/${chatbot.id}`}
                title="Chatbot Preview"
                className="w-full h-[500px] border rounded shadow-sm bg-white"
              />
            </div>
          </CardContent>
        </Card>

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
              Uploading...
            </span>
          ) : (
            'Upload Documents'
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}