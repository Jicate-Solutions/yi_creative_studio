'use client'

/**
 * CodeBlock Component
 * Syntax highlighted code block with copy functionality
 */

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  showLineNumbers?: boolean
}

export default function CodeBlock({
  code,
  language = 'typescript',
  title,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Custom theme based on Yi brand colors
  const customStyle = {
    ...oneDark,
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      background: '#1a2332',
      margin: 0,
      padding: '1rem',
      borderRadius: '0 0 0.5rem 0.5rem',
      fontSize: '0.875rem',
    },
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      background: 'transparent',
    },
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-[#1a2332] my-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {title && <span className="text-sm text-slate-400">{title}</span>}
          <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
            {language}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1 text-green-400" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        showLineNumbers={showLineNumbers}
        wrapLines
        customStyle={{
          margin: 0,
          background: '#1a2332',
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  )
}
