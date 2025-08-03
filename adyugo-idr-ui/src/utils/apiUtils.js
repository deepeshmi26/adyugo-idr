const extractErrorMessage = async (response) => {
  const errorBody = await response.json().catch(() => null);
  return errorBody?.error || response.statusText || 'Unknown error occurred';
};

const getAllAdUnits = async (apiKey) => {
  try {
    const response = await fetch('http://localhost:9988/ad-units', {
      headers: {
        'Api-Key': apiKey 
      }
    });
    if (!response.ok) {
      throw await extractErrorMessage(response);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    throw e;
  }
};

const getAdUnitById = async (id, apiKey) => {
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  try {
    const fields = [
      'ad_network_settings',
      'disabled_ad_network_settings',
      'frequency_capping_settings',
      'bid_floors',
      'banner_refresh_settings',
      'segments'
    ].join(',');

    const response = await fetch(`http://localhost:9988/ad-unit/${id}?fields=${fields}`, {
      headers: {
        'Api-Key': apiKey
      }
    });
    if (!response.ok) {
      throw await extractErrorMessage(response);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    throw e;
  }
};

const setAdUnitById = async (id, apiKey, data) => {
  try {
    const response = await fetch(`http://localhost:9988/ad-unit/${id}`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw await extractErrorMessage(response);
    }
    return true;
  } catch (e) {
    throw e;
  }
};

const handleSendNotification = async (data) => {
  try {
    const response = await fetch('http://localhost:9988/send-slack-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await extractErrorMessage(response);
    }

    return response.json();  // assuming the API returns some JSON response
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

const apiUtils = {
  getAllAdUnits,
  getAdUnitById,
  setAdUnitById,
  handleSendNotification,
};

export default apiUtils;
