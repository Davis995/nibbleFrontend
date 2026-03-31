"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Play, ArrowLeft, AlertCircle, Copy, Check, Zap } from 'lucide-react';
import { ToolService, API_BASE_URL } from '../services/api';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ToolPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slugFromUrl = searchParams.get('slug');

  const [selectedTool, setSelectedTool] = useState(slugFromUrl || '');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { data: tools = [], isLoading: isLoadingTools } = useQuery({
    queryKey: ['ai-tools-flat'],
    queryFn: () => ToolService.fetchAllFlat(),
  });

  const { data: toolDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['ai-tool-detail', selectedTool],
    queryFn: () => ToolService.fetchDetail(selectedTool),
    enabled: !!selectedTool,
  });

  // Pre-select from URL, or fall back to first tool when list loads
  useEffect(() => {
    if (!selectedTool && tools.length > 0) {
      setSelectedTool(tools[0].slug);
    }
  }, [tools, selectedTool]);

  // Reset form when tool changes
  useEffect(() => {
    if (toolDetail?.inputs) {
      const initial: Record<string, string> = {};
      toolDetail.inputs.forEach((i: any) => {
        initial[i.label] = i.default_value || '';
      });
      setFormValues(initial);
      setResult(null);
      setErrorMsg(null);
    }
  }, [toolDetail]);

  // Sync URL slug when selector changes
  const handleToolChange = (slug: string) => {
    setSelectedTool(slug);
    router.replace(`/admin/tools/preview?slug=${slug}`);
  };

  const inputs = toolDetail?.inputs || [];
  const sortedInputs = [...inputs].sort((a: any, b: any) => a.order - b.order);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setResult(null);
    setErrorMsg(null);

    try {
      // Pull token from localStorage (same pattern as api.ts)
      let authHeader = '';
      if (typeof window !== 'undefined') {
        const tokensStr = localStorage.getItem('tokens');
        if (tokensStr) {
          try {
            const parsed = JSON.parse(tokensStr);
            if (parsed?.access) authHeader = `Bearer ${parsed.access}`;
          } catch {}
        }
      }

      const payload = {
        tool_slug: selectedTool,
        inputs: formValues,
      };

      const response = await fetch(`${API_BASE_URL}/tools/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || data.detail || `Error ${response.status}`);
      }

      // response field may vary — support common shapes
      const output = data.response || data.result || data.content || data.text || JSON.stringify(data, null, 2);
      setResult(output);

      // Scroll result into view
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Check the console.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tools/library"
            className="p-2 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <Eye className="w-6 h-6 text-gray-400" />
              Preview &amp; Testing Panel
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Runs real AI requests via the live backend</p>
          </div>
        </div>

        {/* Tool selector synced with URL slug */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Tool:</span>
          {isLoadingTools ? (
            <div className="h-9 w-48 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <select
              value={selectedTool}
              onChange={(e) => handleToolChange(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-4 py-2 bg-white shadow-sm min-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tools.map((t: any) => (
                <option key={t.slug} value={t.slug}>
                  {t.student_friendly_name || t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left: dynamic form */}
        <div className="w-full lg:w-[360px] shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/80">
            <h3 className="font-semibold text-gray-800">
              {toolDetail ? (toolDetail.student_friendly_name || toolDetail.name) : 'Tool Form'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {toolDetail?.description || 'Select a tool to see its form.'}
            </p>
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-white">
            {!selectedTool ? (
              <p className="text-sm text-gray-400 text-center py-10">Select a tool above.</p>
            ) : isLoadingDetail ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-100 rounded w-full" />
                <div className="h-10 bg-gray-100 rounded w-full" />
                <div className="h-10 bg-gray-100 rounded w-3/4" />
              </div>
            ) : sortedInputs.length === 0 ? (
              <div className="text-center py-10 px-4 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-400 text-sm">No input fields configured for this tool.</p>
              </div>
            ) : (
              <form id="previewForm" onSubmit={handleRun} className="space-y-5">
                {sortedInputs.map((inp: any) => (
                  <div key={inp.id} className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 capitalize">
                      {inp.label} {inp.required && <span className="text-red-500">*</span>}
                    </label>

                    {inp.type === 'textarea' ? (
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px] transition-shadow placeholder:text-gray-400"
                        placeholder={inp.placeholder || ''}
                        required={inp.required}
                        minLength={inp.minlength}
                        maxLength={inp.maxlength}
                        value={formValues[inp.label] || ''}
                        onChange={e => setFormValues({ ...formValues, [inp.label]: e.target.value })}
                      />
                    ) : inp.type === 'dropdown' ? (
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={inp.required}
                        value={formValues[inp.label] || ''}
                        onChange={e => setFormValues({ ...formValues, [inp.label]: e.target.value })}
                      >
                        <option value="" disabled>Select an option</option>
                        {Array.isArray(inp.options) && inp.options.map((opt: string, i: number) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={inp.type || 'text'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder:text-gray-400"
                        placeholder={inp.placeholder || ''}
                        required={inp.required}
                        minLength={inp.minlength}
                        maxLength={inp.maxlength}
                        value={formValues[inp.label] || ''}
                        onChange={e => setFormValues({ ...formValues, [inp.label]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </form>
            )}
          </div>

          {/* Run button */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <button
              form="previewForm"
              type="submit"
              disabled={isRunning || !selectedTool || sortedInputs.length === 0}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium shadow shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Run Tool
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: result */}
        <div ref={resultRef} className="w-full lg:flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Play className="w-4 h-4 text-gray-400" />
              AI Response
            </h3>
            <div className="flex items-center gap-2">
              {result && (
                <>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    Success
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </>
              )}
              {errorMsg && (
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Error
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 p-6 relative bg-white overflow-y-auto">
            {isRunning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 animate-in fade-in">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Generating response...</p>
              </div>
            ) : errorMsg ? (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 text-sm">Request Failed</p>
                  <p className="text-red-600 text-sm mt-1">{errorMsg}</p>
                </div>
              </div>
            ) : result ? (
              <div className="prose prose-blue max-w-none
                  prose-headings:text-gray-800 prose-headings:font-bold
                  prose-p:text-gray-600 prose-p:leading-relaxed
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:list-disc prose-ul:pl-5
                  prose-ol:list-decimal prose-ol:pl-5
                  prose-li:text-gray-600
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                  prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-[''] prose-code:after:content-['']
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg
                ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
                  <Zap className="w-8 h-8 text-gray-300" />
                </div>
                <div>
                  <p className="text-gray-500 font-medium text-lg">Awaiting Execution</p>
                  <p className="text-gray-400 text-sm mt-1 max-w-sm">
                    Fill in the form and click <strong>Run Tool</strong> to call the live AI backend.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
