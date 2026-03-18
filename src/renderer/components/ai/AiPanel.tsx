import { useState, useEffect, useRef, useCallback } from 'react';
import type { Task } from '../../../shared/types';
import { useProjectStore } from '../../stores/projectStore';

interface AiPanelProps {
  task: Task;
  onClose: () => void;
}

export function AiPanel({ task, onClose }: AiPanelProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const jobIdRef = useRef<string | null>(null);

  const projects = useProjectStore((s) => s.projects);
  const project = projects.find((p) => p.id === task.projectId);

  useEffect(() => {
    window.electronAPI.ai.hasApiKey().then(setHasKey);
  }, []);

  // Subscribe to streaming events
  useEffect(() => {
    const unsubChunk = window.electronAPI.ai.onChunk((jobId, chunk) => {
      if (jobId === jobIdRef.current) {
        setResponse((prev) => prev + chunk);
      }
    });
    const unsubDone = window.electronAPI.ai.onDone((jobId) => {
      if (jobId === jobIdRef.current) {
        setIsStreaming(false);
      }
    });
    const unsubError = window.electronAPI.ai.onError((jobId, err) => {
      if (jobId === jobIdRef.current) {
        setError(err);
        setIsStreaming(false);
      }
    });

    return () => {
      unsubChunk();
      unsubDone();
      unsubError();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const handleDelegate = async () => {
    setResponse('');
    setError(null);
    setIsStreaming(true);

    const jobId = await window.electronAPI.ai.delegateTask({
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description,
      projectName: project?.name || '',
      gitRepoPath: project?.gitRepoPath || undefined,
      userPrompt: userPrompt.trim() || undefined,
    });
    jobIdRef.current = jobId;
  };

  const handleCancel = () => {
    if (jobIdRef.current) {
      window.electronAPI.ai.cancelJob(jobIdRef.current);
      setIsStreaming(false);
    }
  };

  const handleSaveKey = async () => {
    if (apiKeyInput.trim()) {
      await window.electronAPI.ai.setApiKey(apiKeyInput.trim());
      setHasKey(true);
      setShowKeyInput(false);
      setApiKeyInput('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-1 border border-border rounded-xl w-[600px] max-h-[80vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Delegate to AI</h2>
            <p className="text-xs text-text-tertiary mt-0.5 truncate max-w-[400px]">{task.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {hasKey ? 'Key set' : 'Set API key'}
            </button>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              x
            </button>
          </div>
        </div>

        {/* API Key Input */}
        {(showKeyInput || !hasKey) && (
          <div className="px-5 py-3 border-b border-border bg-surface-2/50">
            <label className="text-xs text-text-secondary mb-1 block">Claude API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleSaveKey}
                disabled={!apiKeyInput.trim()}
                className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Prompt input */}
        <div className="px-5 py-3 border-b border-border">
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Additional instructions (optional)..."
            rows={2}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Response */}
        <div
          ref={responseRef}
          className="flex-1 overflow-y-auto px-5 py-4 min-h-[200px] max-h-[400px]"
        >
          {response ? (
            <pre className="text-sm text-text-primary whitespace-pre-wrap font-sans leading-relaxed">
              {response}
              {isStreaming && <span className="animate-pulse">▊</span>}
            </pre>
          ) : error ? (
            <div className="text-sm text-danger">{error}</div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-text-tertiary">
              {isStreaming ? 'Thinking...' : 'Click "Delegate" to send this task to Claude'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-border flex justify-between">
          <div>
            {response && !isStreaming && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
              >
                Copy response
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isStreaming ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-danger hover:bg-surface-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={handleDelegate}
                disabled={!hasKey}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delegate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
