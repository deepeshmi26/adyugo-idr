import React, { useEffect, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import fetchUtils from './utils/fetchUtils';


const Table = ({ data, isProcessOver }) => {
  const columns = [...fetchUtils.columns];

  if(!isProcessOver){
    columns.shift();
    columns.pop();
  }

  const table = useMaterialReactTable({
    columns: columns,
    data: data,
    enableExpandAll: false,
    enableExpanding: true,
    enableSorting: false,
    enableColumnActions: false,
    enableBottomToolbar: false,
    paginateExpandedRows: false,
    filterFromLeafRows: false,
    getSubRows: (row) => row.subRows,
    initialState: { expanded: true },
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: row.depth === 0 ? '#E3F2FD' : 'inherit',
        color: row.depth === 0 ? '#2196F3' : 'inherit',
        '& .MuiTableCell-root': {
          padding: '6px 12px',
        },
      },
    }),
    enableTopToolbar: false,
  });

  return <MaterialReactTable table={table} />;
};

const STORAGE_KEY = "confirmClicks";
const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

const FormGrid = (props) => {
  const { managementKey, networkPatterns, data,setData } = props;
  const [loading, setLoading] = useState('');
  const [isProcessOver , setIsProcessOver] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleConfirm = async () => {
    setLoading('Processing request, please wait...');
    const dataAfterProcess = await fetchUtils.onConfirm(data, networkPatterns, managementKey);
    setData(dataAfterProcess);
    setIsProcessOver(true);
    setLoading('');
    const newCount = clickCount + 1;
    setClickCount(newCount);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));

    // if (newCount >= 2) {
    //   setIsDisabled(true);
    // }
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (stored?.date === today) {
      setClickCount(stored.count);
      // if (stored.count >= 2) {
      //   setIsDisabled(true);
      // }
    } else {
      // Reset count for new day
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // backgroundColor: '#f7f9fc',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              border: '4px solid #e0e0e0',
              borderTop: '4px solid #1976d2',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ fontSize: '16px', color: '#555' }}>{loading}</p>
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', minHeight: '100vh' }}>
      <div
        style={{
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <h1 style={{ fontSize: '24px', color: '#1a237e', margin: 0 }}>
          {isProcessOver ? 'Result': 'Review and Confirm Updates'}
          
        </h1>
        <p style={{ fontSize: '14px', color: '#555', marginTop: '6px' }}>
          { isProcessOver ? 'Refresh completed below are the results': 'Please review the data below and click confirm to refresh Adyugo placements.'}
        </p>
      </div>

      {
  isProcessOver ? null : (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', position: 'relative' }}>
      <div style={{ display: 'inline-block', position: 'relative' }}>
        {isDisabled && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '110%',
              transform: 'translateY(-50%)',
              backgroundColor: '#333',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 10,
              marginRight: '6px',
            }}
          >
            Cannot refresh more than 2 times a day
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={isDisabled}
          style={{
            backgroundColor: isDisabled ? '#ccc' : '#1976d2',
            color: isDisabled ? '#666' : '#fff',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.3s',
          }}
          onMouseOver={(e) => {
            if (!isDisabled) e.target.style.backgroundColor = '#1565c0';
          }}
          onMouseOut={(e) => {
            if (!isDisabled) e.target.style.backgroundColor = '#1976d2';
          }}
        >
          Run script
        </button>
      </div>
    </div>
  )
}
      <Table data={data} isProcessOver={isProcessOver} />
    </div>
  );
};

export default FormGrid;
