import React from 'react';
import AutoComplete from './AutoComplete';

// Example of a custom selection API function
const customSelectionAPI = async (selectedValue: string, { signal }: { signal?: AbortSignal } = {}) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if aborted
  if (signal?.aborted) throw new Error('Aborted');
  
  // Return related suggestions based on the selected value
  const relatedSuggestions = {
    'apple': ['apple pie', 'apple juice', 'apple tree', 'apple sauce', 'green apple'],
    'banana': ['banana bread', 'banana split', 'banana smoothie', 'banana republic', 'banana hammock'],
    'orange': ['orange juice', 'orange peel', 'orange county', 'orange chicken', 'blood orange'],
    'grape': ['grape vine', 'grape juice', 'grape fruit', 'grape leaves', 'sour grapes'],
    'strawberry': ['strawberry jam', 'strawberry fields', 'strawberry shortcake', 'strawberry blonde', 'wild strawberry']
  };
  
  const key = selectedValue.toLowerCase();
  return relatedSuggestions[key as keyof typeof relatedSuggestions] || [
    `${selectedValue} related`,
    `${selectedValue} similar`,
    `${selectedValue} variant`,
    `like ${selectedValue}`,
    `${selectedValue} alternative`
  ];
};

const SelectionDemo: React.FC = () => {
  const [selectedItem, setSelectedItem] = React.useState<string>('');
  
  const handleSelection = (value: string) => {
    setSelectedItem(value);
    console.log('Selection made:', value);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Autocomplete with Custom Selection API Demo</h2>
      <p>
        This demo shows how the autocomplete component calls a selection API when you choose an item.
        Try typing "apple", "banana", "orange", "grape", or "strawberry" and select one to see related suggestions!
      </p>
      
      {selectedItem && (
        <div style={{ 
          background: '#e8f5e8', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #4caf50'
        }}>
          <strong>Last selected:</strong> {selectedItem}
        </div>
      )}
      
      <AutoComplete 
        selectionFn={customSelectionAPI}
        onSelect={handleSelection}
        placeholder="Type a fruit name..."
      />
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>How it works:</h3>
        <ol>
          <li>Type to get initial search suggestions</li>
          <li>Select an item from the dropdown</li>
          <li>The selection API is called with the selected value</li>
          <li>New related suggestions are populated in the dropdown</li>
        </ol>
      </div>
    </div>
  );
};

export default SelectionDemo;
