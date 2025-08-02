import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WebhookTrigger, WebhookConnection } from '../types';
import { Zap, Settings, AlertCircle } from 'lucide-react';

interface WebhookTriggerNodeData {
  trigger: WebhookTrigger;
  connection?: WebhookConnection;
  onEdit?: (triggerId: string) => void;
}

export const WebhookTriggerNode: React.FC<NodeProps<WebhookTriggerNodeData>> = ({ 
  data, 
  selected 
}) => {
  const { trigger, connection, onEdit } = data;
  
  const getStatusColor = () => {
    if (!trigger.isActive) return '#94a3b8'; // Inactive - gray
    if (!connection || !connection.isActive) return '#f59e0b'; // Warning - amber
    return '#10b981'; // Active - green
  };

  const getStatusIcon = () => {
    if (!trigger.isActive || !connection?.isActive) {
      return <AlertCircle size={14} />;
    }
    return <Zap size={14} />;
  };

  const getTriggerTypeLabel = () => {
    switch (trigger.triggerType) {
      case 'on_entry': return 'On Entry';
      case 'on_exit': return 'On Exit';
      case 'conditional': return 'Conditional';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`webhook-trigger-node ${selected ? 'selected' : ''}`}>
      {/* Webhook triggers connect to pages via top/bottom */}
      <Handle
        type="source"
        position={Position.Top}
        id="webhook-top"
        style={{ top: -6, background: '#10b981' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="webhook-bottom"
        style={{ bottom: -6, background: '#10b981' }}
      />
      
      <div className="webhook-trigger-header">
        <div className="trigger-icon" style={{ color: getStatusColor() }}>
          {getStatusIcon()}
        </div>
        <div className="trigger-info">
          <div className="trigger-name">{trigger.name}</div>
          <div className="trigger-type">{getTriggerTypeLabel()}</div>
        </div>
        <button 
          className="trigger-settings"
          onClick={() => onEdit?.(trigger.id)}
          style={{ background: 'transparent', border: 'none', color: '#718096', cursor: 'pointer' }}
        >
          <Settings size={14} />
        </button>
      </div>
      
      <div className="webhook-trigger-body">
        <div className="connection-name">
          {connection ? connection.name : 'No Connection'}
        </div>
        <div className="connection-status" style={{ color: getStatusColor() }}>
          {trigger.isActive && connection?.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>
    </div>
  );
};