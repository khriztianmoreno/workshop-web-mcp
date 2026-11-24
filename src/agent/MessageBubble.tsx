import Markdown, { type Components } from 'react-markdown';

// Model output can carry text injected through untrusted tool results (e.g. product reviews),
// so markdown is rendered defensively: no raw HTML, no images (they would auto-load a URL and
// could exfiltrate data), and links limited to http(s).
const DISALLOWED_ELEMENTS = ['img'];

function safeUrl(url: string): string {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? url : '';
  } catch {
    return '';
  }
}

const components: Components = {
  a: ({ node: _node, href, children, ...rest }) =>
    href ? (
      <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
};

export function MessageBubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  if (role === 'user') return <p className="msg msg--user">{text}</p>;
  return (
    <div className="msg msg--assistant msg--markdown">
      <Markdown skipHtml disallowedElements={DISALLOWED_ELEMENTS} unwrapDisallowed urlTransform={safeUrl} components={components}>
        {text}
      </Markdown>
    </div>
  );
}
