import React, { useState, useEffect } from 'react'
import { Modal, Spin, Button, message, Tooltip } from 'antd'
import {
  DownloadOutlined,
  ExportOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  CopyOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import type { DriveItem } from '@/types/drive'
import { driveService } from '@/services/driveService'
import { getFileIcon, formatDateModified } from './DriveTable'

interface DriveFilePreviewModalProps {
  open: boolean
  file: DriveItem | null
  onClose: () => void
}

export const DriveFilePreviewModal: React.FC<DriveFilePreviewModalProps> = ({
  open,
  file,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loadingText, setLoadingText] = useState(false)
  const [copied, setCopied] = useState(false)

  // Reset controls when file changes
  useEffect(() => {
    setZoom(1)
    setRotation(0)
    setTextContent(null)
    setCopied(false)

    if (!file || !open) return

    const mime = (file.mimeType || '').toLowerCase()
    const name = (file.name || '').toLowerCase()
    const isText =
      mime.includes('text') ||
      mime.includes('json') ||
      mime.includes('javascript') ||
      mime.includes('typescript') ||
      mime.includes('html') ||
      mime.includes('css') ||
      mime.includes('xml') ||
      name.endsWith('.txt') ||
      name.endsWith('.json') ||
      name.endsWith('.md') ||
      name.endsWith('.csv') ||
      name.endsWith('.ts') ||
      name.endsWith('.tsx') ||
      name.endsWith('.js') ||
      name.endsWith('.log')

    if (isText && !file.isFolder) {
      setLoadingText(true)
      driveService
        .getFileText(file.id)
        .then((txt) => {
          setTextContent(txt)
        })
        .catch(() => {
          setTextContent('Unable to load text preview for this file.')
        })
        .finally(() => {
          setLoadingText(false)
        })
    }
  }, [file, open])

  if (!file) return null

  const mime = (file.mimeType || '').toLowerCase()
  const name = (file.name || '').toLowerCase()

  const isImage =
    mime.startsWith('image/') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.gif') ||
    name.endsWith('.webp') ||
    name.endsWith('.svg')

  const isPdf = mime === 'application/pdf' || name.endsWith('.pdf')

  const isGoogleWorkspace =
    mime.startsWith('application/vnd.google-apps.document') ||
    mime.startsWith('application/vnd.google-apps.spreadsheet') ||
    mime.startsWith('application/vnd.google-apps.presentation')

  const isVideo =
    mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm')

  const isAudio =
    mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav')

  const contentUrl = driveService.getFileContentUrl(file.id)

  const handleDownload = () => {
    if (file.webContentLink) {
      window.open(file.webContentLink, '_blank')
    } else {
      window.open(contentUrl, '_blank')
    }
  }

  const handleOpenExternal = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
    } else {
      window.open(contentUrl, '_blank')
    }
  }

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent)
      setCopied(true)
      message.success('Copied file content to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 1100, top: 24 }}
      closeIcon={<CloseOutlined className="text-slate-500 hover:text-slate-800 text-base" />}
      styles={{
        body: {
          padding: 0,
        },
      }}
      destroyOnClose
    >
      <div className="flex flex-col h-[82vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white select-none">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className="p-2 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              {getFileIcon(file)}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-normal">
                <span>{file.formattedSize || '—'}</span>
                <span>•</span>
                <span>Modified {formatDateModified(file.modifiedTime)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pr-8 shrink-0">
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              className="text-xs rounded-full border-slate-200 hover:border-blue-500 hover:text-blue-600"
            >
              Download
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleOpenExternal}
              type="primary"
              className="text-xs rounded-full bg-blue-600 hover:bg-blue-500 shadow-xs"
            >
              Open in Drive
            </Button>
          </div>
        </div>

        {/* Modal Body / Preview Canvas */}
        <div className="flex-1 bg-slate-900/5 relative overflow-hidden flex items-center justify-center">
          {/* 1. Image Preview */}
          {isImage ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
              <div className="relative overflow-auto max-w-full max-h-full flex items-center justify-center">
                <img
                  src={contentUrl}
                  alt={file.name}
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    maxWidth: '100%',
                    maxHeight: '68vh',
                    objectFit: 'contain',
                  }}
                  className="rounded-lg shadow-lg select-none"
                />
              </div>

              {/* Floating Image Controls */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/80 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl text-xs z-10">
                <Tooltip title="Zoom out">
                  <button
                    onClick={() => setZoom((prev) => Math.max(0.2, prev - 0.25))}
                    className="p-1 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <ZoomOutOutlined className="text-sm" />
                  </button>
                </Tooltip>
                <span className="text-[11px] font-mono px-1 select-none">{Math.round(zoom * 100)}%</span>
                <Tooltip title="Zoom in">
                  <button
                    onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
                    className="p-1 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <ZoomInOutlined className="text-sm" />
                  </button>
                </Tooltip>
                <div className="w-px h-3 bg-slate-600 mx-1" />
                <Tooltip title="Rotate 90°">
                  <button
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="p-1 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <ReloadOutlined className="text-sm" />
                  </button>
                </Tooltip>
                <Tooltip title="Reset">
                  <button
                    onClick={() => {
                      setZoom(1)
                      setRotation(0)
                    }}
                    className="text-[10px] uppercase font-semibold text-slate-300 hover:text-white px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </Tooltip>
              </div>
            </div>
          ) : isPdf ? (
            /* 2. PDF Preview */
            <div className="w-full h-full flex flex-col">
              <iframe
                src={`${contentUrl}#toolbar=1`}
                title={file.name}
                className="w-full h-full border-0 bg-white"
              />
            </div>
          ) : isGoogleWorkspace && file.webViewLink ? (
            /* 3. Google Workspace Docs / Sheets / Slides */
            <div className="w-full h-full flex flex-col">
              <iframe
                src={file.webViewLink.replace('/view', '/preview')}
                title={file.name}
                className="w-full h-full border-0 bg-white"
                allow="autoplay"
              />
            </div>
          ) : isVideo ? (
            /* 4. Video Preview */
            <div className="w-full h-full flex items-center justify-center p-4">
              <video
                controls
                autoPlay={false}
                src={contentUrl}
                className="max-w-full max-h-[70vh] rounded-lg shadow-xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : isAudio ? (
            /* 5. Audio Preview */
            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="text-4xl text-blue-600 mb-2">🎵</div>
              <span className="text-sm font-semibold text-slate-800">{file.name}</span>
              <audio controls src={contentUrl} className="w-80" />
            </div>
          ) : textContent !== null ? (
            /* 6. Code / Text Preview */
            <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/60 text-slate-300">
                <span className="text-[11px] font-medium">{file.name}</span>
                <Button
                  size="small"
                  type="text"
                  icon={copied ? <CheckOutlined className="text-emerald-400" /> : <CopyOutlined />}
                  onClick={handleCopyText}
                  className="text-xs text-slate-300 hover:text-white"
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed select-text">
                {loadingText ? (
                  <div className="flex items-center justify-center h-48">
                    <Spin tip="Loading text content..." />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
                )}
              </div>
            </div>
          ) : (
            /* 7. Fallback for other binary files */
            <div className="flex flex-col items-center justify-center gap-4 p-10 text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {getFileIcon(file)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">{file.name}</h4>
                <p className="text-xs text-slate-500">
                  This file type ({file.mimeType || 'unknown'}) cannot be previewed directly in browser.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  className="rounded-full bg-blue-600 hover:bg-blue-500 text-xs px-5"
                >
                  Download File
                </Button>
                {file.webViewLink && (
                  <Button
                    icon={<ExportOutlined />}
                    onClick={handleOpenExternal}
                    className="rounded-full text-xs"
                  >
                    Open in Google Drive
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
