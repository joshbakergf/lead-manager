import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FormPage } from '../types';
import { Trash2 } from 'lucide-react';

interface FormPageNodeData {
  page: FormPage;
  pageNumber: number | null;
  isSelected?: boolean;
}

export const FormPageNode: React.FC<NodeProps<FormPageNodeData>> = ({ data, selected }) => {
  const { page, pageNumber } = data;

  return (
    <div className={`form-node ${selected ? 'selected' : ''}`}>
      {/* Page-to-page connections: Left and Right only */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ right: -6 }}
      />
      
      {/* Webhook connections: Top and Bottom only */}
      <Handle
        type="target"
        position={Position.Top}
        id="webhook-top"
        style={{ top: -6, background: '#10b981' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="webhook-bottom"
        style={{ bottom: -6, background: '#10b981' }}
      />

      <div className="form-node-header">
        <div className="form-node-info">
          {pageNumber && <div className="form-page-number">{pageNumber}</div>}
          <span style={{ fontSize: '0.75rem', color: '#a0aec0', textTransform: 'capitalize' }}>
            {page.type.replace('-', ' ')}
          </span>
        </div>
        <button style={{ background: 'transparent', border: 'none', color: '#718096', cursor: 'pointer' }}>
          <Trash2 style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>

      <h3 className="form-node-title">{page.title || 'Untitled'}</h3>
      
      {page.type === 'form' && page.fields && page.fields.length > 0 ? (
        <div className="form-node-fields">
          <p className="form-node-question">{page.content}</p>
          <div className="form-node-field-count">
            {page.fields.length} field{page.fields.length !== 1 ? 's' : ''}
          </div>
        </div>
      ) : (
        <>
          {page.question && (
            <p className="form-node-question">{page.question}</p>
          )}
          
          {page.content && !page.question && (
            <p className="form-node-question">{page.content}</p>
          )}
        </>
      )}

      <div className="form-node-footer">
        {page.type === 'form' && page.fields ? (
          <div className="form-node-rules">
            {page.fields.filter(f => f.choices && f.choices.length > 0).length > 0 && 
              `${page.fields.filter(f => f.choices && f.choices.length > 0).length} rules`
            }
          </div>
        ) : (
          <>
            {page.choices && page.choices.length > 0 && (
              <div className="form-node-rules">
                {page.choices.length} rules
              </div>
            )}
          </>
        )}
        
        {/* No automatic next page display - all routing is explicit through workflow */}
      </div>
    </div>
  );
};