import React, { useState } from 'react';

const exampleScript = [
  { id: 'start', text: 'Welcome! What is your name?', inputType: 'text', next: 'q1' },
  { id: 'q1', text: 'Are you a new or existing customer?', inputType: 'select', options: ['New', 'Existing'], next: { New: 'end', Existing: 'end' } },
  { id: 'end', text: 'Thanks for calling! Goodbye.', inputType: 'none' }
];

export default function ScriptRunner({ sessionId }) {
  const [answers, setAnswers] = useState({});
  const [currentId, setCurrentId] = useState('start');

  const currentNode = exampleScript.find((n) => n.id === currentId);

  const handleNext = (answer) => {
    setAnswers({ ...answers, [currentId]: answer });
    if (currentNode.next) {
      const nextId = typeof currentNode.next === 'string' ? currentNode.next : currentNode.next[answer];
      setCurrentId(nextId);
    }
  };

  if (!currentNode) return <div>Script complete.</div>;

  return (
    <div>
      <p>{currentNode.text}</p>
      {currentNode.inputType === 'text' && (
        <input placeholder="Enter response" onBlur={(e) => handleNext(e.target.value)} />
      )}
      {currentNode.inputType === 'select' && (
        <div>
          {currentNode.options.map((opt) => (
            <button key={opt} onClick={() => handleNext(opt)}>
              {opt}
            </button>
          ))}
        </div>
      )}
      {currentNode.inputType === 'none' && (
        <button onClick={() => setCurrentId(null)}>Finish</button>
      )}
    </div>
  );
}