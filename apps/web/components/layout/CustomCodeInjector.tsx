'use client';

import { useEffect } from 'react';

function appendHtml(target: HTMLElement, html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const nodes = Array.from(template.content.childNodes);
  nodes.forEach((node) => target.appendChild(node));
  return nodes;
}

export function CustomCodeInjector({
  code,
  target,
  markerId
}: {
  code?: string | null;
  target: 'head' | 'body' | 'footer';
  markerId: string;
}) {
  useEffect(() => {
    const html = String(code || '').trim();
    if (!html) return;

    const mountTarget = target === 'head' ? document.head : document.body;
    const container = document.createElement('div');
    container.setAttribute('data-custom-code-marker', markerId);
    if (target === 'footer') {
      container.setAttribute('data-custom-code-target', 'footer');
    }

    const nodes = appendHtml(container, html);
    nodes.forEach((node) => mountTarget.appendChild(node));

    return () => {
      nodes.forEach((node) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [code, markerId, target]);

  return null;
}
