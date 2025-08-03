import React, { useState } from 'react';

function ConfigInputs(props) {
  const { setManagementKey } = props;

  const [managementKeyInput, setManagementKeyInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setManagementKey(managementKeyInput);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
    <img
      src={'https://adyugo.com/logo.png'}
      alt="adYugo Logo"
      style={{
        width: '275px',
        height: '87px',
        marginBottom: '1rem',
      }}
    />
      <h1 style={{
        fontSize: '2rem',
        color: '#1B1E3C',
        marginBottom: '2rem',
        fontWeight: 600
      }}>
        Welcome to <span style={{ color: '#6e45e2' }}>adYugo IDR Tool</span>
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
          width: '90%',
          maxWidth: '420px'
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="managementKey"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1B1E3C' }}
          >
            Management Key
          </label>
          <input
            type="text"
            id="managementKey"
            value={managementKeyInput}
            onChange={(e) => setManagementKeyInput(e.target.value)} 
            placeholder="Enter Management Key"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dcdcdc',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#6e45e2',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default ConfigInputs;
