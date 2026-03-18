import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  compact?: boolean;
}

const components: Components = {
  a: ({ href, children }) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (href) window.electronAPI.shell.openExternal(href);
      }}
    >
      {children}
    </a>
  ),
};

export function MarkdownRenderer({ content, compact }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${compact ? 'markdown-compact' : ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
