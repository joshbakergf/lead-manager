import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  BarChart3, 
  Settings, 
  Eye, 
  Calendar,
  Users,
  MousePointer,
  CheckSquare,
  Type,
  Hash,
  Mail,
  Phone,
  MapPin,
  Globe,
  Upload,
  Star,
  List,
  ChevronDown,
  X,
  Save,
  Trash2,
  Copy,
  Move,
  Palette,
  Zap,
  MessageSquare,
  Webhook,
  Share2,
  ArrowRight,
  ArrowDown,
  Edit3,
  ChevronRight,
  ChevronLeft,
  Play,
  GripVertical
} from 'lucide-react';

export default function FormBuilderApp() {
  const [activeView, setActiveView] = useState('content');
  const [selectedPage, setSelectedPage] = useState('1');
  const [currentPreviewPage, setCurrentPreviewPage] = useState('1');
  const [showElementPanel, setShowElementPanel] = useState(false);
  const [showLogicPanel, setShowLogicPanel] = useState(false);
  const [draggedPage, setDraggedPage] = useState(null);
  const [dragOverPage, setDragOverPage] = useState(null);
  const [pageOrder, setPageOrder] = useState(['1', '2', '3', '4', '5', '6', '7', 'end']);
  const [isDragging, setIsDragging] = useState(false);
  const [workflowDragOffset, setWorkflowDragOffset] = useState({ x: 0, y: 0 });
  const [workflowPositions, setWorkflowPositions] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [connectionPreview, setConnectionPreview] = useState(null);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState(null);
  
  const [formPages, setFormPages] = useState({
    '1': {
      id: '1',
      title: 'Opening Greeting',
      type: 'welcome',
      question: 'Hello! This is [Your Name] from [Company Name]. How are you doing today?',
      description: 'Start the conversation with a warm, friendly greeting to build rapport',
      required: false,
      options: [],
      logic: [{ condition: 'always', goTo: '2' }]
    },
    '2': {
      id: '2',
      title: 'Verify Homeowner',
      type: 'multiple-choice',
      question: 'Am I speaking with the homeowner?',
      description: 'Confirm you are speaking with the decision maker',
      required: true,
      options: ['Yes, I am the homeowner', 'No, homeowner is not available', 'I rent this property'],
      logic: [
        { condition: 'equals', value: 'Yes, I am the homeowner', goTo: '3' },
        { condition: 'else', goTo: 'end' }
      ]
    },
    '3': {
      id: '3',
      title: 'Gather Contact Info',
      type: 'short-text',
      question: 'Great! Can I get your full name and confirm your address?',
      description: 'Collect basic customer information for service records',
      required: true,
      options: [],
      logic: [{ condition: 'always', goTo: '4' }]
    },
    '4': {
      id: '4',
      title: 'Identify Pain Points',
      type: 'multiple-choice',
      question: 'What brings me to call you today is that many homeowners in your area have been dealing with some common issues. Have you noticed any problems with pests or your heating and cooling system?',
      description: 'Probe for service needs and create urgency',
      required: true,
      options: ['Yes, we have pest issues', 'Yes, HVAC problems', 'Both pest and HVAC issues', 'No major issues'],
      logic: [
        { condition: 'contains', value: 'pest', goTo: '5' },
        { condition: 'contains', value: 'HVAC', goTo: '6' },
        { condition: 'contains', value: 'Both', goTo: '5' },
        { condition: 'else', goTo: '7' }
      ]
    },
    '5': {
      id: '5',
      title: 'Pest Control Presentation',
      type: 'long-text',
      question: 'I completely understand your concern about pests. What we\'ve found is that pests don\'t just go away on their own - they actually get worse over time. Our comprehensive pest control program creates a protective barrier around your home year-round. We\'ve helped thousands of homeowners in your area, and I\'d love to offer you our new customer special.',
      description: 'Present pest control solution with benefits and social proof',
      required: false,
      options: [],
      logic: [{ condition: 'always', goTo: '7' }]
    },
    '6': {
      id: '6',
      title: 'HVAC Service Presentation',
      type: 'long-text',
      question: 'HVAC issues can really impact your comfort and energy bills. Our certified technicians can diagnose and fix any heating or cooling problem, plus we offer maintenance plans that prevent future breakdowns and keep your system running efficiently. Most of our customers save 20-30% on their energy bills after our service.',
      description: 'Present HVAC solution emphasizing comfort and savings',
      required: false,
      options: [],
      logic: [{ condition: 'always', goTo: '7' }]
    },
    '7': {
      id: '7',
      title: 'Close for Appointment',
      type: 'multiple-choice',
      question: 'I\'d love to send one of our specialists out to give you a free estimate. We have availability this week - would morning or afternoon work better for you?',
      description: 'Use assumptive close technique to schedule appointment',
      required: true,
      options: ['Morning works better', 'Afternoon is preferred', 'I need to think about it', 'Not interested'],
      logic: [
        { condition: 'contains', value: 'Morning', goTo: 'end' },
        { condition: 'contains', value: 'Afternoon', goTo: 'end' },
        { condition: 'else', goTo: 'end' }
      ]
    },
    'end': {
      id: 'end',
      title: 'Call Completion',
      type: 'ending',
      question: 'Thank you for your time today!',
      description: 'End the call professionally and follow up as needed based on the outcome',
      required: false,
      options: [],
      logic: []
    }
  });

  // Initialize workflow positions
  React.useEffect(() => {
    const initialPositions = {};
    pageOrder.forEach((id, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      initialPositions[id] = {
        x: 200 + col * 300,
        y: 100 + row * 200
      };
    });
    setWorkflowPositions(initialPositions);
  }, [pageOrder]);

  const handleDragStart = (e, pageId) => {
    setDraggedPage(pageId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    
    // For workflow view, calculate offset
    if (activeView === 'workflow') {
      const rect = e.target.getBoundingClientRect();
      setWorkflowDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleDragOver = (e, pageId) => {
    e.preventDefault();
    if (activeView === 'content') {
      setDragOverPage(pageId);
    }
  };

  const handleDragEnd = (e) => {
    setDraggedPage(null);
    setDragOverPage(null);
    setIsDragging(false);
    
    // For workflow view, update position
    if (activeView === 'workflow' && draggedPage) {
      const container = e.target.closest('.workflow-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const newX = e.clientX - rect.left - workflowDragOffset.x;
        const newY = e.clientY - rect.top - workflowDragOffset.y;
        
        setWorkflowPositions(prev => ({
          ...prev,
          [draggedPage]: {
            x: Math.max(0, newX),
            y: Math.max(0, newY)
          }
        }));
      }
    }
  };

  const handleDrop = (e, targetPageId) => {
    e.preventDefault();
    
    if (activeView === 'content' && draggedPage && targetPageId && draggedPage !== targetPageId) {
      const newOrder = [...pageOrder];
      const draggedIndex = newOrder.indexOf(draggedPage);
      const targetIndex = newOrder.indexOf(targetPageId);
      
      // Remove dragged item and insert at new position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedPage);
      
      setPageOrder(newOrder);
      
      // Renumber pages after reordering
      setTimeout(() => renumberPages(), 0);
    }
    
    setDragOverPage(null);
  };

  const formStats = {
    views: 1429,
    starts: 1128,
    submissions: 968,
    completionRate: 85.8,
    timeToComplete: '04:09'
  };

  const elementTypes = [
    { type: 'welcome', icon: MessageSquare, label: 'Welcome Screen', category: 'special' },
    { type: 'short-text', icon: Type, label: 'Short Text', category: 'input' },
    { type: 'long-text', icon: Type, label: 'Long Text', category: 'input' },
    { type: 'multiple-choice', icon: List, label: 'Multiple Choice', category: 'choice' },
    { type: 'checkbox', icon: CheckSquare, label: 'Checkbox', category: 'choice' },
    { type: 'dropdown', icon: ChevronDown, label: 'Dropdown', category: 'choice' },
    { type: 'email', icon: Mail, label: 'Email', category: 'contact' },
    { type: 'phone', icon: Phone, label: 'Phone', category: 'contact' },
    { type: 'rating', icon: Star, label: 'Rating', category: 'feedback' },
    { type: 'ending', icon: CheckSquare, label: 'Thank You Page', category: 'special' }
  ];

  const addNewPage = (afterPageId = null) => {
    // Find the next available page number
    const existingNumbers = pageOrder
      .filter(id => id !== 'end')
      .map(id => parseInt(id))
      .filter(num => !isNaN(num));
    
    const newPageNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const newPageId = newPageNumber.toString();
    
    const newPage = {
      id: newPageId,
      title: 'New Question',
      type: 'short-text',
      question: 'Untitled Question',
      description: '',
      required: false,
      options: [],
      logic: [{ condition: 'always', goTo: 'end' }]
    };
    
    setFormPages(prev => ({
      ...prev,
      [newPageId]: newPage
    }));
    
    // Add to page order before the end page
    setPageOrder(prev => {
      const endIndex = prev.indexOf('end');
      const newOrder = [...prev];
      newOrder.splice(endIndex, 0, newPageId);
      return newOrder;
    });
    
    setSelectedPage(newPageId);
  };

  const deletePage = (pageId) => {
    if (Object.keys(formPages).length <= 2) return; // Keep at least welcome and end
    
    const newPages = { ...formPages };
    delete newPages[pageId];
    
    // Update logic references
    Object.keys(newPages).forEach(id => {
      newPages[id].logic = newPages[id].logic.map(rule => 
        rule.goTo === pageId ? { ...rule, goTo: 'end' } : rule
      );
    });
    
    setFormPages(newPages);
    setPageOrder(prev => prev.filter(id => id !== pageId));
    
    // Renumber all pages to maintain sequential order
    renumberPages();
    
    setSelectedPage('1');
  };

  const renumberPages = () => {
    setPageOrder(prevOrder => {
      const nonEndPages = prevOrder.filter(id => id !== 'end');
      const endPage = prevOrder.find(id => id === 'end');
      
      // Create new mapping from old IDs to new sequential numbers
      const idMapping = {};
      const newOrder = [];
      
      nonEndPages.forEach((oldId, index) => {
        const newId = (index + 1).toString();
        idMapping[oldId] = newId;
        newOrder.push(newId);
      });
      
      if (endPage) {
        newOrder.push('end');
        idMapping['end'] = 'end';
      }
      
      // Update form pages with new IDs
      setFormPages(prevPages => {
        const newPages = {};
        
        Object.entries(prevPages).forEach(([oldId, page]) => {
          const newId = idMapping[oldId];
          if (newId) {
            newPages[newId] = {
              ...page,
              id: newId,
              logic: page.logic.map(rule => ({
                ...rule,
                goTo: idMapping[rule.goTo] || rule.goTo
              }))
            };
          }
        });
        
        return newPages;
      });
      
      // Update selected page
      setSelectedPage(prev => idMapping[prev] || '1');
      setCurrentPreviewPage(prev => idMapping[prev] || '1');
      
      return newOrder;
    });
  };

  const updatePageLogic = (pageId, newLogic) => {
    setFormPages(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        logic: newLogic
      }
    }));
  };

  const renderPagePreview = (page) => {
    const commonClasses = "bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto";
    
    if (page.type === 'welcome') {
      return (
        <div className={commonClasses}>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={24} />
            </div>
            <h1 className="text-2xl font-bold mb-4">Call Script Ready</h1>
            <p className="text-gray-400 mb-4">{page.question}</p>
            <p className="text-sm text-gray-500 mb-8">{page.description}</p>
            <button 
              onClick={() => {
                const nextPage = page.logic[0]?.goTo;
                if (nextPage && nextPage !== 'end') {
                  setCurrentPreviewPage(nextPage);
                }
              }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Begin Call
            </button>
          </div>
        </div>
      );
    }

    if (page.type === 'ending') {
      return (
        <div className={commonClasses}>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare size={24} />
            </div>
            <h1 className="text-2xl font-bold mb-4">{page.question}</h1>
            <p className="text-gray-400">{page.description}</p>
          </div>
        </div>
      );
    }

    return (
      <div className={commonClasses}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {page.question}
            {page.required && <span className="text-red-400 ml-2">*</span>}
          </h2>
          {page.description && (
            <p className="text-gray-400">{page.description}</p>
          )}

          {activeView === 'results' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Analytics</h2>
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">1,429</div>
                  <div className="text-sm text-gray-400">Total Views</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">968</div>
                  <div className="text-sm text-gray-400">Submissions</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">85.8%</div>
                  <div className="text-sm text-gray-400">Completion Rate</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {page.type === 'short-text' && (
            <input
              type="text"
              placeholder="Type your answer here..."
              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            />
          )}

          {page.type === 'long-text' && (
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-4">
              <div className="text-sm text-blue-400 mb-2">💬 Agent Script:</div>
              <div className="text-gray-200 leading-relaxed">
                {page.question}
              </div>
            </div>
          )}

          {page.type === 'multiple-choice' && (
            <div className="space-y-3">
              {page.options.map((option, index) => (
                <label key={index} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input type="radio" name={page.id} className="text-blue-500" />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          )}

          {page.type === 'checkbox' && (
            <div className="space-y-3">
              {page.options.map((option, index) => (
                <label key={index} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input type="checkbox" className="text-blue-500" />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          )}

          {page.type === 'dropdown' && (
            <select className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white">
              <option value="">Choose an option</option>
              {page.options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          )}
        </div>

        {page.type !== 'ending' && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => {
                const nextPage = page.logic[0]?.goTo;
                if (nextPage && nextPage !== 'end') {
                  setCurrentPreviewPage(nextPage);
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const getConnectionPoint = (pageId, side) => {
    const pos = workflowPositions[pageId];
    if (!pos) return null;
    
    const nodeWidth = 288; // w-72
    const nodeHeight = 120;
    
    switch (side) {
      case 'top':
        return { x: pos.x + nodeWidth / 2, y: pos.y };
      case 'bottom':
        return { x: pos.x + nodeWidth / 2, y: pos.y + nodeHeight };
      case 'left':
        return { x: pos.x, y: pos.y + nodeHeight / 2 };
      case 'right':
        return { x: pos.x + nodeWidth, y: pos.y + nodeHeight / 2 };
      default:
        return { x: pos.x + nodeWidth / 2, y: pos.y + nodeHeight / 2 };
    }
  };

  const handleConnectionStart = (pageId, side, event) => {
    event.stopPropagation();
    setIsConnecting(true);
    setConnectionStart({ pageId, side });
    
    // Add mouse move listener for preview
    const handleMouseMove = (e) => {
      const container = document.querySelector('.workflow-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setConnectionPreview({ x, y });
      }
    };
    
    const handleMouseUp = () => {
      if (!hoveredConnectionPoint) {
        setIsConnecting(false);
        setConnectionStart(null);
        setConnectionPreview(null);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleConnectionEnd = (targetPageId, targetSide, event) => {
    event.stopPropagation();
    
    if (isConnecting && connectionStart && connectionStart.pageId !== targetPageId) {
      // Update the logic for the source page
      setFormPages(prev => ({
        ...prev,
        [connectionStart.pageId]: {
          ...prev[connectionStart.pageId],
          logic: [
            ...prev[connectionStart.pageId].logic.filter(rule => rule.goTo !== targetPageId),
            { 
              condition: 'always', 
              goTo: targetPageId,
              fromSide: connectionStart.side,
              toSide: targetSide
            }
          ]
        }
      }));
    }
    
    setIsConnecting(false);
    setConnectionStart(null);
    setConnectionPreview(null);
    setHoveredConnectionPoint(null);
  };

  const calculateElbowPathWithSides = (fromPageId, toPageId, fromSide, toSide) => {
    const fromPoint = getConnectionPoint(fromPageId, fromSide || 'bottom');
    const toPoint = getConnectionPoint(toPageId, toSide || 'top');
    
    if (!fromPoint || !toPoint) return '';
    
    const { x: fromX, y: fromY } = fromPoint;
    const { x: toX, y: toY } = toPoint;
    
    // Node dimensions for collision detection
    const nodeWidth = 288;
    const nodeHeight = 120;
    const clearance = 40; // Minimum clearance around nodes
    const initialBend = 20;
    
    // Get all node positions for collision detection
    const allNodes = Object.entries(workflowPositions).map(([id, pos]) => ({
      id,
      left: pos.x,
      right: pos.x + nodeWidth,
      top: pos.y,
      bottom: pos.y + nodeHeight,
      centerX: pos.x + nodeWidth / 2,
      centerY: pos.y + nodeHeight / 2
    }));
    
    // Helper function to check if a horizontal line intersects any nodes
    const getHorizontalClearance = (y, startX, endX) => {
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      
      for (const node of allNodes) {
        if (node.id === fromPageId || node.id === toPageId) continue;
        
        // Check if line passes through node area
        if (y >= node.top - clearance && y <= node.bottom + clearance &&
            maxX >= node.left - clearance && minX <= node.right + clearance) {
          
          // Route around the node
          if (startX < endX) {
            // Going left to right - route above or below
            return y < node.centerY ? node.top - clearance : node.bottom + clearance;
          } else {
            // Going right to left - route above or below  
            return y < node.centerY ? node.top - clearance : node.bottom + clearance;
          }
        }
      }
      return y; // No collision, use original Y
    };
    
    // Helper function to check if a vertical line intersects any nodes
    const getVerticalClearance = (x, startY, endY) => {
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      for (const node of allNodes) {
        if (node.id === fromPageId || node.id === toPageId) continue;
        
        // Check if line passes through node area
        if (x >= node.left - clearance && x <= node.right + clearance &&
            maxY >= node.top - clearance && minY <= node.bottom + clearance) {
          
          // Route around the node
          if (startY < endY) {
            // Going top to bottom - route left or right
            return x < node.centerX ? node.left - clearance : node.right + clearance;
          } else {
            // Going bottom to top - route left or right
            return x < node.centerX ? node.left - clearance : node.right + clearance;
          }
        }
      }
      return x; // No collision, use original X
    };
    
    let path = '';
    
    if (fromSide === 'right' && toSide === 'left') {
      // Horizontal connection with collision avoidance
      const midX = fromX + (toX - fromX) / 2;
      const routeY = getHorizontalClearance(fromY, fromX, toX);
      
      if (routeY === fromY) {
        // No collision - simple path
        path = `M ${fromX} ${fromY} L ${fromX + initialBend} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX - initialBend} ${toY} L ${toX} ${toY}`;
      } else {
        // Route around obstacles
        path = `M ${fromX} ${fromY} L ${fromX + initialBend} ${fromY} L ${fromX + initialBend} ${routeY} L ${toX - initialBend} ${routeY} L ${toX - initialBend} ${toY} L ${toX} ${toY}`;
      }
    } else if (fromSide === 'bottom' && toSide === 'top') {
      // Vertical connection with collision avoidance
      const midY = fromY + (toY - fromY) / 2;
      const routeX = getVerticalClearance(fromX, fromY, toY);
      
      if (routeX === fromX) {
        // No collision - simple path
        path = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
      } else {
        // Route around obstacles
        path = `M ${fromX} ${fromY} L ${fromX} ${fromY + initialBend} L ${routeX} ${fromY + initialBend} L ${routeX} ${toY - initialBend} L ${toX} ${toY - initialBend} L ${toX} ${toY}`;
      }
    } else if (fromSide === 'left' && toSide === 'right') {
      // Reverse horizontal with collision avoidance
      const buffer = 60;
      const routeX = Math.min(fromX - buffer, toX - buffer);
      const routeY = getHorizontalClearance(fromY, routeX, routeX);
      
      path = `M ${fromX} ${fromY} L ${fromX - initialBend} ${fromY} L ${routeX} ${fromY} L ${routeX} ${routeY} L ${routeX} ${toY} L ${toX + initialBend} ${toY} L ${toX} ${toY}`;
    } else if (fromSide === 'top' && toSide === 'bottom') {
      // Reverse vertical with collision avoidance
      const buffer = 60;
      const routeY = Math.min(fromY - buffer, toY - buffer);
      const routeX = getVerticalClearance(fromX, routeY, routeY);
      
      path = `M ${fromX} ${fromY} L ${fromX} ${fromY - initialBend} L ${fromX} ${routeY} L ${routeX} ${routeY} L ${toX} ${routeY} L ${toX} ${toY + initialBend} L ${toX} ${toY}`;
    } else {
      // Mixed connections with smart collision avoidance
      if (fromSide === 'right' && toSide === 'top') {
        const bendX = fromX + initialBend;
        const bendY = toY - initialBend;
        const routeY = getHorizontalClearance(bendY, bendX, toX);
        path = `M ${fromX} ${fromY} L ${bendX} ${fromY} L ${bendX} ${routeY} L ${toX} ${routeY} L ${toX} ${toY}`;
      } else if (fromSide === 'right' && toSide === 'bottom') {
        const bendX = fromX + initialBend;
        const bendY = toY + initialBend;
        const routeY = getHorizontalClearance(bendY, bendX, toX);
        path = `M ${fromX} ${fromY} L ${bendX} ${fromY} L ${bendX} ${routeY} L ${toX} ${routeY} L ${toX} ${toY}`;
      } else if (fromSide === 'left' && toSide === 'top') {
        const bendX = fromX - initialBend;
        const bendY = toY - initialBend;
        const routeY = getHorizontalClearance(bendY, bendX, toX);
        path = `M ${fromX} ${fromY} L ${bendX} ${fromY} L ${bendX} ${routeY} L ${toX} ${routeY} L ${toX} ${toY}`;
      } else if (fromSide === 'left' && toSide === 'bottom') {
        const bendX = fromX - initialBend;
        const bendY = toY + initialBend;
        const routeY = getHorizontalClearance(bendY, bendX, toX);
        path = `M ${fromX} ${fromY} L ${bendX} ${fromY} L ${bendX} ${routeY} L ${toX} ${routeY} L ${toX} ${toY}`;
      } else if (fromSide === 'bottom' && toSide === 'left') {
        const bendY = fromY + initialBend;
        const bendX = toX - initialBend;
        const routeX = getVerticalClearance(bendX, bendY, toY);
        path = `M ${fromX} ${fromY} L ${fromX} ${bendY} L ${routeX} ${bendY} L ${routeX} ${toY} L ${toX} ${toY}`;
      } else if (fromSide === 'bottom' && toSide === 'right') {
        const bendY = fromY + initialBend;
        const bendX = toX + initialBend;
        const routeX = getVerticalClearance(bendX, bendY, toY);
        path = `M ${fromX} ${fromY} L ${fromX} ${bendY} L ${routeX} ${bendY} L ${routeX} ${toY} L ${toX} ${toY}`;
      } else if (fromSide === 'top' && toSide === 'left') {
        const bendY = fromY - initialBend;
        const bendX = toX - initialBend;
        const routeX = getVerticalClearance(bendX, bendY, toY);
        path = `M ${fromX} ${fromY} L ${fromX} ${bendY} L ${routeX} ${bendY} L ${routeX} ${toY} L ${toX} ${toY}`;
      } else if (fromSide === 'top' && toSide === 'right') {
        const bendY = fromY - initialBend;
        const bendX = toX + initialBend;
        const routeX = getVerticalClearance(bendX, bendY, toY);
        path = `M ${fromX} ${fromY} L ${fromX} ${bendY} L ${routeX} ${bendY} L ${routeX} ${toY} L ${toX} ${toY}`;
      } else {
        // Fallback with collision avoidance
        if (Math.abs(fromX - toX) > Math.abs(fromY - toY)) {
          const midX = fromX + (toX - fromX) / 2;
          const routeY = getHorizontalClearance(fromY, fromX, toX);
          path = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${routeY} L ${midX} ${toY} L ${toX} ${toY}`;
        } else {
          const midY = fromY + (toY - fromY) / 2;
          const routeX = getVerticalClearance(fromX, fromY, toY);
          path = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${routeX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
        }
      }
    }
    
    // Calculate arrow direction based on final segment
    const pathSegments = path.split(' L ');
    const lastSegment = pathSegments[pathSegments.length - 1];
    const secondLastSegment = pathSegments[pathSegments.length - 2];
    
    if (pathSegments.length >= 2) {
      const [lastX, lastY] = lastSegment.split(' ').map(Number);
      const [secondLastX, secondLastY] = secondLastSegment.split(' ').map(Number);
      
      // Calculate angle for arrow direction
      const angle = Math.atan2(lastY - secondLastY, lastX - secondLastX) * 180 / Math.PI;
      
      return { path, angle, endPoint: { x: toX, y: toY } };
    }
    
    return { path, angle: 0, endPoint: { x: toX, y: toY } };
  };

  const renderWorkflowView = () => {
    const orderedPages = pageOrder.map(id => formPages[id]).filter(Boolean);
    
    return (
      <div className="workflow-container relative w-full h-full bg-gray-900 overflow-auto" style={{ minHeight: '600px' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* Render elbow connection lines */}
          {orderedPages.map(page => 
            page.logic.map((rule, index) => {
              const pathData = calculateElbowPathWithSides(
                page.id, 
                rule.goTo, 
                rule.fromSide || 'bottom', 
                rule.toSide || 'top'
              );
              
              if (!pathData || !pathData.path) return null;
              
              const { path, angle, endPoint } = pathData;
              
              return (
                <g key={`${page.id}-${index}`}>
                  {/* Drop shadow for depth */}
                  <path
                    d={path}
                    stroke="#1F2937"
                    strokeWidth="3"
                    fill="none"
                    transform="translate(2, 2)"
                    opacity="0.3"
                  />
                  {/* Main connector line */}
                  <path
                    d={path}
                    stroke="#4F46E5"
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* Custom positioned arrow */}
                  <polygon
                    points="0,0 6,3 0,6"
                    fill="#4F46E5"
                    transform={`translate(${endPoint.x - 6}, ${endPoint.y - 3}) rotate(${angle}, 6, 3)`}
                  />
                </g>
              );
            })
          )}
          
          {/* Connection preview line */}
          {isConnecting && connectionStart && connectionPreview && (
            <g>
              <line
                x1={getConnectionPoint(connectionStart.pageId, connectionStart.side)?.x}
                y1={getConnectionPoint(connectionStart.pageId, connectionStart.side)?.y}
                x2={connectionPreview.x}
                y2={connectionPreview.y}
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.8"
              />
              {/* Small preview arrow */}
              <polygon
                points="0,0 4,2 0,4"
                fill="#10B981"
                transform={`translate(${connectionPreview.x - 4}, ${connectionPreview.y - 2})`}
                opacity="0.8"
              />
            </g>
          )}
          
          <defs>
            {/* Keep the original marker as fallback but make it smaller */}
            <marker id="arrowhead" markerWidth="8" markerHeight="6" 
              refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 8 3, 0 6" fill="#4F46E5" />
            </marker>
          </defs>
        </svg>

        {/* Render page nodes */}
        {orderedPages.map(page => {
          const pos = workflowPositions[page.id];
          if (!pos) return null;
          
          return (
            <div
              key={page.id}
              draggable={!isConnecting}
              onDragStart={(e) => !isConnecting && handleDragStart(e, page.id)}
              onDragEnd={handleDragEnd}
              className={`absolute w-72 bg-gray-800 border-2 rounded-lg transition-all shadow-lg ${
                selectedPage === page.id 
                  ? 'border-blue-500 shadow-blue-500/25 ring-2 ring-blue-500/20' 
                  : 'border-gray-600 hover:border-gray-500 hover:shadow-xl'
              } ${isDragging && draggedPage === page.id ? 'opacity-50 scale-105 rotate-2' : isConnecting ? 'cursor-crosshair' : 'cursor-move'}`}
              style={{ 
                left: pos.x, 
                top: pos.y,
                zIndex: selectedPage === page.id ? 10 : 5
              }}
              onClick={() => !isConnecting && setSelectedPage(page.id)}
            >
              {/* Connection Points */}
              {['top', 'right', 'bottom', 'left'].map(side => {
                const isStartPoint = connectionStart?.pageId === page.id && connectionStart?.side === side;
                const isHovered = hoveredConnectionPoint?.pageId === page.id && hoveredConnectionPoint?.side === side;
                
                let sideClasses = "absolute w-3 h-3 rounded-full border-2 border-gray-800 transition-all cursor-pointer";
                let sideStyles = {};
                
                switch (side) {
                  case 'top':
                    sideClasses += " -top-1.5 left-1/2 transform -translate-x-1/2";
                    break;
                  case 'right':
                    sideClasses += " -right-1.5 top-1/2 transform -translate-y-1/2";
                    break;
                  case 'bottom':
                    sideClasses += " -bottom-1.5 left-1/2 transform -translate-x-1/2";
                    break;
                  case 'left':
                    sideClasses += " -left-1.5 top-1/2 transform -translate-y-1/2";
                    break;
                }
                
                if (isStartPoint) {
                  sideClasses += " bg-green-500 scale-150";
                } else if (isHovered || (isConnecting && connectionStart?.pageId !== page.id)) {
                  sideClasses += " bg-blue-500 scale-125 hover:scale-150";
                } else {
                  sideClasses += " bg-gray-600 hover:bg-blue-500 hover:scale-125";
                }
                
                return (
                  <div
                    key={side}
                    className={sideClasses}
                    style={sideStyles}
                    onMouseDown={(e) => handleConnectionStart(page.id, side, e)}
                    onMouseUp={(e) => handleConnectionEnd(page.id, side, e)}
                    onMouseEnter={() => setHoveredConnectionPoint({ pageId: page.id, side })}
                    onMouseLeave={() => setHoveredConnectionPoint(null)}
                    title={`Connect from ${side}`}
                  />
                );
              })}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <GripVertical size={16} className="text-gray-500 cursor-move shrink-0" />
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold min-w-[32px] shrink-0">
                      {page.id === 'end' ? '✓' : page.id}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">{page.title}</div>
                      <div className="text-xs text-gray-400 truncate">{page.type}</div>
                    </div>
                  </div>
                  {page.id !== '1' && page.id !== 'end' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePage(page.id);
                      }}
                      className="text-gray-400 hover:text-red-400 p-1 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                
                <div className="text-sm text-gray-300 mb-3 line-clamp-2">
                  {page.question}
                </div>
                
                {page.logic.length > 0 && (
                  <div className="text-xs text-gray-400 bg-gray-700/50 rounded px-2 py-1">
                    {page.logic.length === 1 
                      ? `→ ${page.logic[0].goTo === 'end' ? 'End' : `Page ${page.logic[0].goTo}`}`
                      : `${page.logic.length} rules`
                    }
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Grid background for better positioning */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(#374151 1px, transparent 1px),
              linear-gradient(90deg, #374151 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Connection mode indicator */}
        {isConnecting && (
          <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="text-sm font-medium">Connection Mode</div>
            <div className="text-xs">Click on a connection point to complete</div>
          </div>
        )}

        {/* Add Page Button */}
        <button
          onClick={() => addNewPage()}
          disabled={isConnecting}
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
          style={{ zIndex: 20 }}
        >
          <Plus size={24} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <CheckSquare size={16} />
              </div>
              <span className="font-semibold">FormBuilder Pro</span>
            </div>
            <div className="text-gray-400">›</div>
            <span className="text-gray-300">Call Center Sales Script</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <Share2 size={16} />
              Share
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-8">
          {[
            { id: 'content', label: 'Content', icon: Type },
            { id: 'workflow', label: 'Workflow', icon: Zap },
            { id: 'connect', label: 'Connect', icon: Webhook },
            { id: 'share', label: 'Share', icon: Share2 },
            { id: 'results', label: 'Results', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          {activeView === 'content' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Form Pages</h2>
                <div className="space-y-2">
                  {pageOrder.map((pageId) => {
                    const page = formPages[pageId];
                    if (!page) return null;
                    
                    return (
                      <div
                        key={page.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, page.id)}
                        onDragOver={(e) => handleDragOver(e, page.id)}
                        onDrop={(e) => handleDrop(e, page.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPage === page.id
                            ? 'border-blue-500 bg-gray-700'
                            : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                        } ${
                          dragOverPage === page.id && draggedPage !== page.id
                            ? 'border-yellow-500 bg-yellow-900/20'
                            : ''
                        } ${
                          isDragging && draggedPage === page.id
                            ? 'opacity-50 scale-95'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedPage(page.id);
                          setCurrentPreviewPage(page.id);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <GripVertical size={16} className="text-gray-500 cursor-move" />
                            <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold min-w-[32px] shrink-0">
                              {page.id === 'end' ? '✓' : page.id}
                            </span>
                            <span className="text-sm font-medium truncate">{page.title}</span>
                          </div>
                          {page.required && (
                            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 ml-10 truncate">
                          {page.type} • {page.question.length > 25 ? page.question.substring(0, 25) + '...' : page.question}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <button
                onClick={() => addNewPage()}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
              >
                <Plus size={20} />
                Add Page
              </button>

              {selectedPage && formPages[selectedPage] ? (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="font-medium mb-4">Page Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Question</label>
                      <input
                        key={`question-${selectedPage}`}
                        type="text"
                        value={formPages[selectedPage].question || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFormPages(prev => ({
                            ...prev,
                            [selectedPage]: {
                              ...prev[selectedPage],
                              question: newValue,
                              title: newValue.length > 20 ? newValue.substring(0, 20) + '...' : newValue
                            }
                          }));
                        }}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        key={`description-${selectedPage}`}
                        value={formPages[selectedPage].description || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFormPages(prev => ({
                            ...prev,
                            [selectedPage]: {
                              ...prev[selectedPage],
                              description: newValue
                            }
                          }));
                        }}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Required</span>
                      <input
                        key={`required-${selectedPage}`}
                        type="checkbox"
                        checked={formPages[selectedPage].required || false}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          setFormPages(prev => ({
                            ...prev,
                            [selectedPage]: {
                              ...prev[selectedPage],
                              required: newValue
                            }
                          }));
                        }}
                        className="rounded"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}

          
          {activeView === 'workflow' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Workflow Logic</h2>
              {selectedPage && formPages[selectedPage] ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-2">Selected Page</h3>
                    <div className="text-sm text-gray-300">
                      {formPages[selectedPage].title}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Logic Rules</h3>
                    <div className="space-y-2">
                      {formPages[selectedPage].logic.map((rule, index) => (
                        <div key={index} className="p-3 bg-gray-700 rounded-lg">
                          <div className="text-sm">
                            <span className="text-gray-400">If: </span>
                            <span className="text-white">{rule.condition}</span>
                          </div>
                          <div className="text-sm mt-1">
                            <span className="text-gray-400">Go to: </span>
                            <span className="text-blue-400">
                              {rule.goTo === 'end' ? 'End' : `Page ${rule.goTo}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setShowLogicPanel(true)}
                      className="w-full mt-3 p-2 border border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                    >
                      Edit Logic
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeView === 'results' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Analytics</h2>
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{formStats.views.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Total Views</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{formStats.submissions}</div>
                  <div className="text-sm text-gray-400">Submissions</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{formStats.completionRate}%</div>
                  <div className="text-sm text-gray-400">Completion Rate</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'content' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Page Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        const pageIds = Object.keys(formPages);
                        const currentIndex = pageIds.indexOf(currentPreviewPage);
                        if (currentIndex > 0) {
                          setCurrentPreviewPage(pageIds[currentIndex - 1]);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
                      disabled={currentPreviewPage === '1'}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="text-sm text-gray-400">
                      Page {currentPreviewPage} of {Object.keys(formPages).length}
                    </div>
                    
                    <button
                      onClick={() => {
                        const pageIds = Object.keys(formPages);
                        const currentIndex = pageIds.indexOf(currentPreviewPage);
                        if (currentIndex < pageIds.length - 1) {
                          setCurrentPreviewPage(pageIds[currentIndex + 1]);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
                      disabled={currentPreviewPage === 'end'}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setCurrentPreviewPage(pageOrder[0])}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <Play size={16} />
                    Preview Form
                  </button>
                </div>

                {/* Page Preview */}
                {formPages[currentPreviewPage] && renderPagePreview(formPages[currentPreviewPage])}
              </div>
            </div>
          )}

          {activeView === 'workflow' && (
            <div className="h-full">
              {renderWorkflowView()}
            </div>
          )}

          {activeView === 'results' && (
            <div className="h-full p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Form Analytics</h2>
              
              <div className="grid grid-cols-5 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{formStats.views.toLocaleString()}</div>
                  <div className="text-gray-400">Views</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">{formStats.starts.toLocaleString()}</div>
                  <div className="text-gray-400">Starts</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{formStats.submissions}</div>
                  <div className="text-gray-400">Submissions</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">{formStats.completionRate}%</div>
                  <div className="text-gray-400">Completion</div>
                </div>  
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">{formStats.timeToComplete}</div>
                  <div className="text-gray-400">Avg. Time</div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Drop-off Analysis</h3>
                <div className="space-y-3">
                  {pageOrder.map((pageId, index) => {
                    const page = formPages[pageId];
                    if (!page) return null;
                    
                    const dropOffRate = Math.max(0, 15 - index * 2);
                    return (
                      <div key={page.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                        <span>{page.title}</span>
                        <span className="text-red-400">-{dropOffRate}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logic Panel Modal */}
      {showLogicPanel && selectedPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-2xl max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Logic - {formPages[selectedPage].title}</h2>
              <button
                onClick={() => setShowLogicPanel(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">If condition is met</span>
                    <select className="bg-gray-600 rounded px-3 py-1 text-sm">
                      <option>Always</option>
                      <option>Contains</option>
                      <option>Equals</option>
                      <option>Is empty</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Then go to:</span>
                    <select className="bg-gray-600 rounded px-3 py-1 text-sm">
                      {Object.values(formPages).map(page => (
                        <option key={page.id} value={page.id}>
                          {page.id === 'end' ? 'End Screen' : `Page ${page.id} - ${page.title}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowLogicPanel(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowLogicPanel(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save Logic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}