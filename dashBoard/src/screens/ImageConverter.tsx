import React, { useState } from 'react';
import api from '@/api/axios';
import { Upload, Button, Card, Typography, message, Image, Divider, Progress } from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  FileImageOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
  CompressOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Text } = Typography;
const { Dragger } = Upload;

type CompressionStats = {
  originalSize: number
  compressedSize: number
  compressionPercent: number
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const ImageConverter: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [convertedImageUrl, setConvertedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);

  const handleConvert = async () => {
    if (fileList.length === 0) {
      message.error("Please select an image first.");
      return;
    }

    const selectedFile = (fileList[0].originFileObj || fileList[0]) as File;

    if (!selectedFile) {
      message.error("Invalid file selected.");
      return;
    }

    // Create preview of original
    const previewUrl = URL.createObjectURL(selectedFile);
    setOriginalPreview(previewUrl);

    const formData = new FormData();
    formData.append("image", selectedFile);

    setIsLoading(true);
    setStats(null);

    try {
      const response = await api.post(
        "/image/convert",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: 'blob',
        }
      );

      // Read compression stats from response headers
      const originalSize = parseInt(response.headers['x-original-size'] || '0', 10);
      const compressedSize = parseInt(response.headers['x-compressed-size'] || '0', 10);
      const compressionPercent = parseInt(response.headers['x-compression-percent'] || '0', 10);

      setStats({ originalSize, compressedSize, compressionPercent });

      const webpBlob = new Blob([response.data], { type: "image/webp" });
      const webpUrl = URL.createObjectURL(webpBlob);

      setConvertedImageUrl(webpUrl);
      message.success(`Image compressed by ${compressionPercent}% and converted to WebP!`);

    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      message.error(error.response?.data?.message || 'Failed to convert image.')
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFileList([]);
    if (convertedImageUrl) URL.revokeObjectURL(convertedImageUrl);
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setConvertedImageUrl(null);
    setOriginalPreview(null);
    setStats(null);
  };

  const uploadProps: UploadProps = {
    onRemove: () => {
      handleReset();
    },
    beforeUpload: (file) => {
      setFileList([file as unknown as UploadFile]);
      if (convertedImageUrl) {
        URL.revokeObjectURL(convertedImageUrl);
        setConvertedImageUrl(null);
      }
      if (originalPreview) {
        URL.revokeObjectURL(originalPreview);
        setOriginalPreview(null);
      }
      setStats(null);
      return false;
    },
    fileList,
    maxCount: 1,
    accept: "image/*",
    className: "upload-list-inline",
  };

  return (
    <div className="flex-1 w-full bg-muted p-4 sm:p-6 lg:p-10 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-8 mt-2 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-brand-blue rounded-xl hidden sm:block">
              <FileImageOutlined className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight m-0">
                WebP Image Optimizer
              </h1>
              <p className="text-gray-500 mt-2 text-sm font-medium leading-relaxed max-w-2xl">
                Upload your heavy PNGs or JPEGs and convert them instantly to highly-optimized, next-gen WebP formats without compromising on visual quality.
              </p>
            </div>
          </div>
        </div>

        {/* Compression Stats Banner - appears after conversion */}
        {stats && (
          <div
            className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl shadow-lg p-6 sm:p-8 text-white animate-[fadeSlideUp_0.5s_ease-out]"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              {/* Circular Progress */}
              <div className="flex-shrink-0 relative">
                <Progress
                  type="circle"
                  percent={stats.compressionPercent}
                  size={120}
                  strokeColor={{
                    '0%': '#ffffff',
                    '100%': '#a7f3d0',
                  }}
                  trailColor="rgba(255,255,255,0.2)"
                  format={(percent) => (
                    <div className="text-center">
                      <span className="text-3xl font-black text-white">{percent}%</span>
                      <br />
                      <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">Smaller</span>
                    </div>
                  )}
                />
              </div>

              {/* Stats Details */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <FileImageOutlined className="text-emerald-200" />
                    <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Original</span>
                  </div>
                  <p className="text-xl font-bold text-white m-0">{formatFileSize(stats.originalSize)}</p>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <CompressOutlined className="text-emerald-200" />
                    <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Compressed</span>
                  </div>
                  <p className="text-xl font-bold text-white m-0">{formatFileSize(stats.compressedSize)}</p>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <ThunderboltOutlined className="text-yellow-300" />
                    <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Saved</span>
                  </div>
                  <p className="text-xl font-bold text-white m-0">
                    {formatFileSize(stats.originalSize - stats.compressedSize)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

          {/* Upload Section */}
          <Card
            className="lg:col-span-1 shadow-sm rounded-2xl border-gray-100 overflow-hidden flex flex-col h-full"
            styles={{ body: { padding: '32px', display: 'flex', flexDirection: 'column', flex: 1 } }}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-brand-blue text-xs font-bold text-center">1</span>
              Upload Original Image
            </h3>

            <Dragger
              {...uploadProps}
              className="bg-gray-50/50 hover:bg-gray-50 transition-colors border-2 border-dashed border-gray-200 rounded-xl overflow-hidden px-4 py-8 flex-1 flex items-center justify-center flex-col"
            >
              {fileList.length === 0 ? (
                <>
                  <p className="ant-upload-drag-icon text-brand-blue mb-4">
                    <InboxOutlined className="text-6xl opacity-80" />
                  </p>
                  <p className="text-lg font-semibold text-gray-800 mb-2">Click or drag image to this area</p>
                  <p className="text-sm text-gray-500 px-4 sm:px-8">
                    Supported formats include JPG, PNG, GIF, and TIFF.
                  </p>
                </>
              ) : (
                <div className="py-4 flex flex-col items-center justify-center">
                  {convertedImageUrl ? (
                    <>
                      <CheckCircleFilled className="text-4xl text-emerald-500 mb-2" />
                      <p className="text-emerald-600 font-semibold text-lg mb-1">Conversion Complete!</p>
                      <p className="text-sm text-gray-400">Upload a new image to convert again.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-brand-blue font-semibold text-lg mb-1">Image Ready!</p>
                      <p className="text-sm text-gray-400">Click the button below to convert.</p>
                    </>
                  )}
                </div>
              )}
            </Dragger>

            <div className="mt-auto pt-6 space-y-3">
              <Button
                type="primary"
                size="large"
                className="w-full h-14 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all not-disabled:bg-primary"
                onClick={handleConvert}
                disabled={fileList.length === 0 || isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Converting to WebP...' : 'Convert Image Now'}
              </Button>

              {convertedImageUrl && (
                <Button
                  size="large"
                  className="w-full h-12 rounded-xl text-base font-medium"
                  onClick={handleReset}
                >
                  Reset & Convert Another
                </Button>
              )}
            </div>
          </Card>

          {/* Result Section */}
          <Card
            className="lg:col-span-1 shadow-sm rounded-2xl border-gray-100 flex flex-col h-full"
            styles={{ body: { padding: '32px', display: 'flex', flexDirection: 'column', flex: 1 } }}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold text-center">2</span>
              Resulting WebP
            </h3>

            {!convertedImageUrl ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50 p-8 text-center text-gray-400 min-h-[300px]">
                {isLoading ? (
                  <>
                    <LoadingOutlined className="text-5xl text-primary mb-4 animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Processing your image...</p>
                    <p className="text-xs text-gray-400 mt-1">Converting to optimized WebP format</p>
                  </>
                ) : (
                  <>
                    <FileImageOutlined className="text-5xl mb-4 opacity-50" />
                    <p className="text-sm font-medium text-gray-500">Your optimized image will appear here</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between flex-1 animate-[fadeSlideUp_0.4s_ease-out]">
                <div className="relative group w-full bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-center min-h-[200px]">
                  <Image
                    src={convertedImageUrl}
                    alt="Converted WebP"
                    className="rounded-lg shadow-sm object-contain max-h-[250px] w-auto max-w-full"
                    preview={{
                      mask: <div className="text-white text-sm font-medium">Click to Preview</div>
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm tracking-wider">
                    WEBP
                  </div>
                  {stats && (
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1.5">
                      <ThunderboltOutlined className="text-yellow-400" />
                      <span>{stats.compressionPercent}% smaller</span>
                    </div>
                  )}
                </div>

                <div className="w-full mt-auto">
                  <Divider className="my-6" />

                  <div className="w-full space-y-3">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      href={convertedImageUrl}
                      download="optimized-image.webp"
                      size="large"
                      className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 border-none shadow-md hover:shadow-lg text-white font-semibold"
                    >
                      Download WebP Image
                    </Button>
                    <Text type="secondary" className="block text-center text-xs font-medium">
                      File is ready and temporarily stored in your browser.
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageConverter;
