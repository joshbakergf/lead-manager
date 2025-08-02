import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Home, Calendar, Square, Loader } from 'lucide-react';
import { PropertyData, EnhancedAddressValue } from '../types';
// Dynamic import for zillowService to avoid initialization issues

interface EnhancedAddressFieldProps {
  value: EnhancedAddressValue | string;
  onChange: (value: EnhancedAddressValue) => void;
  placeholder?: string;
  showPropertyPreview?: boolean;
  onPropertyData?: (data: PropertyData) => void;
  disabled?: boolean;
  required?: boolean;
}

export const EnhancedAddressField: React.FC<EnhancedAddressFieldProps> = ({
  value,
  onChange,
  placeholder = 'Start typing an address...',
  showPropertyPreview = true,
  onPropertyData,
  disabled = false,
  required = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PropertyData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse value
  useEffect(() => {
    if (typeof value === 'string') {
      setSearchQuery(value);
    } else if (value?.address) {
      setSearchQuery(value.address);
      setSelectedProperty(value.propertyData || null);
    }
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    // Update value immediately for manual entry
    onChange({
      address: query,
      propertyData: selectedProperty || undefined,
      manualOverride: !selectedProperty
    });

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search for very short queries
    if (query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);

      try {
        // Zillow integration temporarily disabled
        // TODO: Re-implement with proper error handling
        console.log('Property search requested for:', query);
        setSearchResults([]); // Return empty results for now
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const selectProperty = (property: PropertyData) => {
    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
    setSearchQuery(fullAddress);
    setSelectedProperty(property);
    setShowDropdown(false);
    
    // Update parent value
    onChange({
      address: fullAddress,
      propertyData: property,
      manualOverride: false
    });

    // Notify parent of property data
    if (onPropertyData) {
      onPropertyData(property);
    }
  };

  const clearSelection = () => {
    setSearchQuery('');
    setSelectedProperty(null);
    setSearchResults([]);
    onChange({
      address: '',
      propertyData: undefined,
      manualOverride: false
    });
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  return (
    <div className="enhanced-address-field">
      <div className="address-input-wrapper">
        <div className="address-input">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 3 && setShowDropdown(true)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="address-input-field"
          />
          {isSearching && <Loader size={16} className="loading-icon spinning" />}
          {selectedProperty && !isSearching && (
            <button
              type="button"
              onClick={clearSelection}
              className="clear-btn"
              disabled={disabled}
            >
              ×
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div ref={dropdownRef} className="address-dropdown">
            {searchResults.map((property, index) => (
              <div
                key={property.zpid || index}
                className="address-result"
                onClick={() => selectProperty(property)}
              >
                <div className="result-icon">
                  <MapPin size={16} />
                </div>
                <div className="result-content">
                  <div className="result-address">{property.address}</div>
                  <div className="result-details">
                    {property.city}, {property.state} {property.zipCode}
                    {property.sqft && ` • ${formatNumber(property.sqft)} sqft`}
                    {property.bedrooms && ` • ${property.bedrooms} bed`}
                    {property.bathrooms && ` • ${property.bathrooms} bath`}
                  </div>
                </div>
                {property.zestimate && (
                  <div className="result-price">
                    ${formatNumber(property.zestimate)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {showDropdown && !isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
          <div ref={dropdownRef} className="address-dropdown">
            <div className="no-results">
              No properties found. You can still enter the address manually.
            </div>
          </div>
        )}
      </div>

      {/* Property Preview Card */}
      {showPropertyPreview && selectedProperty && (
        <div className="property-preview">
          {selectedProperty.imageUrl && (
            <img 
              src={selectedProperty.imageUrl} 
              alt={selectedProperty.address}
              className="property-image"
            />
          )}
          <div className="property-details">
            <h4 className="property-address">
              <Home size={16} />
              {selectedProperty.address}
            </h4>
            <div className="property-location">
              {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
            </div>
            
            <div className="property-stats">
              {selectedProperty.sqft && (
                <div className="stat">
                  <Square size={14} />
                  <span>{formatNumber(selectedProperty.sqft)} sqft</span>
                </div>
              )}
              {selectedProperty.lotSize && (
                <div className="stat">
                  <MapPin size={14} />
                  <span>{formatNumber(selectedProperty.lotSize)} sqft lot</span>
                </div>
              )}
              {selectedProperty.yearBuilt && (
                <div className="stat">
                  <Calendar size={14} />
                  <span>Built {selectedProperty.yearBuilt}</span>
                </div>
              )}
            </div>

            {selectedProperty.zestimate && (
              <div className="property-value">
                <span className="label">Zestimate:</span>
                <span className="value">${formatNumber(selectedProperty.zestimate)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};