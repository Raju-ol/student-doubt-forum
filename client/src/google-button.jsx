import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';

let scriptPromise;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    function unavailable() {
      clearTimeout(timer);
      script.remove();
      reject(new Error('Google sign-in could not load. Refresh the page to try again.'));
    }
    const timer = setTimeout(unavailable, 10000);
    script.onload = () => {
      const google = window.google?.accounts?.id;
      if (!google) return unavailable();
      clearTimeout(timer);
      resolve(google);
    };
    script.onerror = unavailable;
    document.head.append(script);
  }).catch(error => {
    scriptPromise = undefined;
    throw error;
  });
  return scriptPromise;
}

export function GoogleButton({ onCredential, disabled = false }) {
  const container = useRef(null);
  const current = useRef({ onCredential, disabled });
  const [error, setError] = useState('');
  useEffect(() => { current.current = { onCredential, disabled }; }, [onCredential, disabled]);
  useEffect(() => {
    let active = true;
    const node = container.current;
    const controller = new AbortController();
    async function render() {
      let config;
      try { config = await api('/auth/google/config', { signal: controller.signal }); }
      catch { return; }
      if (!active || !config.clientId) return;
      try {
        const google = await loadGoogle();
        if (!active) return;
        google.initialize({
          client_id: config.clientId,
          callback: ({ credential }) => {
            if (active && !current.current.disabled && credential) current.current.onCredential(credential);
          },
        });
        google.renderButton(node, { theme: 'outline', size: 'large', text: 'continue_with' });
      } catch (error) {
        if (active) setError(error.message);
      }
    }
    render();
    return () => {
      active = false;
      controller.abort();
      node.replaceChildren();
    };
  }, []);
  return <><div ref={container} hidden={disabled} />{error && <p role="status">{error}</p>}</>;
}
