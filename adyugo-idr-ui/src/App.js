import './App.css';
import { useEffect, useState } from 'react';
import ConfigInputs from './input';
import FormGrid from './confirmation';
import fetchUtils from './utils/fetchUtils';

const networkPatterns= ['12855523957','22405025169,23137657932'];

function App() {
  const [managementKey, setManagementKey] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try{
        setLoading('Loading data, please wait...');
        const formattedData = await fetchUtils.getAdUnitsTable(managementKey, networkPatterns);
        setData(fetchUtils.convertColumnData(formattedData));
        setLoading('');
      }catch(e){
        setLoading('');
        alert(e);
      }
    };
    if(managementKey){
      fetchData();
    }
  }, [managementKey, setData]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f7f9fc',
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

  const getComponent = ()=>{
    if(!data || !data.length){
      return(
      <ConfigInputs
        setManagementKey={setManagementKey}
      />);
    }
    return(
    <FormGrid
      managementKey={managementKey}
      networkPatterns={networkPatterns}
      data={data}
      setData={(val)=>{
        setData(val);
      }}
    />);
  }

  return (
    <div className="App">
      {
        getComponent()
      }
    </div>
  );
}

export default App;
