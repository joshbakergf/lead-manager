import React from 'react';

export default function ScriptNodeEditor({ nodes, setNodes }) {
  const addNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      text: '',
      inputType: 'text',
      next: ''
    };
    setNodes([...nodes, newNode]);
  };

  const updateNode = (index, field, value) => {
    const updated = [...nodes];
    updated[index][field] = value;
    setNodes(updated);
  };

  return (
    <div>
      {nodes.map((node, i) => (
        <div key={node.id}>
          <input
            placeholder="Question text"
            value={node.text}
            onChange={(e) => updateNode(i, 'text', e.target.value)}
          />
          <select
            value={node.inputType}
            onChange={(e) => updateNode(i, 'inputType', e.target.value)}
          >
            <option value="text">Text</option>
            <option value="select">Select</option>
          </select>
          <input
            placeholder="Next node ID"
            value={node.next}
            onChange={(e) => updateNode(i, 'next', e.target.value)}
          />
        </div>
      ))}
      <button onClick={addNode}>Add Node</button>
    </div>
  );
}