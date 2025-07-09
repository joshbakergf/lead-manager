import React from 'react';

export default function ScriptFlowPreview({ nodes }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          <strong>{node.id}</strong>: {node.text} → <em>{node.next}</em>
        </li>
      ))}
    </ul>
  );
}