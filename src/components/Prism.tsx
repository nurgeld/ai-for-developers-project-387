import { useState, useEffect } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface PrismPlaygroundProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: object;
}

export function PrismPlayground({ method, endpoint, body }: PrismPlaygroundProps) {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResponse('');
  }, [endpoint, method]);

  const executeRequest = async () => {
    setLoading(true);
    try {
      const options: RequestInit = { method };
      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }
      const res = await fetch(`/api${endpoint}`, options);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Error');
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ 
          fontWeight: 'bold', 
          color: method === 'GET' ? '#228be6' : method === 'POST' ? '#40c057' : '#fab005' 
        }}>{method}</span>
        <code style={{ flex: 1 }}>{endpoint}</code>
        <button onClick={executeRequest} disabled={loading}>
          {loading ? 'Loading...' : 'Execute'}
        </button>
      </div>
      {body && (
        <Highlight theme={themes.github} code={JSON.stringify(body, null, 2)} language="json">
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{ ...style, padding: 8, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
      {response && (
        <Highlight theme={themes.github} code={response} language="json">
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{ ...style, padding: 8, fontSize: 12, maxHeight: 300, overflow: 'auto', marginTop: 8, background: '#f6f8fa' }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
    </div>
  );
}
