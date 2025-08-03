// proxy-server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const {uploadCsvToSlackChannel, sendMessageToSlack} = require('./slackUtils');


const app = express();
const PORT = 9988;
const SLACK_CHANNEL ="some_shit";
const BOT = "some_shit_yet_again";

app.use(express.json());
app.use(cors());

const SLACK_WEBHOOK_URL = 'some_url';


function formatError(err, defaultMsg = 'Internal Server Error') {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err.message) return err.message;
  return defaultMsg;
}

function extractMessageFromAppLovin(data, status) {
  return (
    data?.errorMessage?.parameters?.description ||
    data?.errorMessage?.parameters?.message ||
    data?.errorMessage?.id ||
    `Applovin Error ${status}`
  );
}

async function safeFetchJson(url, options = {}) {
  try {
    const response = await fetch(url, options);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { response, data };
  } catch (err) {
    if (err.message.includes('Network Error')) {
      console.error('Network Error:', err);
      throw new Error('Network error: Internet connection unstable or API unreachable');
    }
    console.error('API Error:', err);
    throw err;
  }
}

// Slack Notification Endpoint
app.post('/send-slack-notification', async (req, res) => {
  try {
    console.log(req.body);
    const { csv, text } = req.body;
    let runScript = false;
    if(text){
      runScript = true;
      await sendMessageToSlack(text,SLACK_CHANNEL,BOT);
    }
    if(csv){
      runScript = true;
      await uploadCsvToSlackChannel(csv,SLACK_CHANNEL, BOT);
    }
    if(runScript){
      return res.status(200).json({ success: true, message: 'Notification sent' });
    }else{
      throw new Error("Invalid keys in req body");
    }
  } catch (err) {
    console.error('Slack Notification Error:', err);
    return res.status(500).json({ success: false, error: formatError('Slack Notification Error:'+err) });
  }
});

// GET Ad Units
app.get('/ad-units', async (req, res) => {
  try {
    const apiKey = req.headers['api-key'];
    if (!apiKey) return res.status(400).json({ success: false, error: 'API Key is required' });

    const { response, data } = await safeFetchJson('https://o.applovin.com/mediation/v1/ad_units', {
      headers: { 'Api-Key': apiKey },
    });

    if (!response.ok) {
      const message = extractMessageFromAppLovin(data, response.status);
      return res.status(response.status).json({ success: false, error: message });
    }

    return res.json(data);
  } catch (err) {
    return res.status(503).json({ success: false, error: formatError(err) });
  }
});

// GET Single Ad Unit
app.get('/ad-unit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;
    const apiKey = req.headers['api-key'];
    if (!apiKey) return res.status(400).json({ success: false, error: 'API Key is required' });

    const fieldsParam = fields ? `&fields=${fields}` : '';
    const url = `https://o.applovin.com/mediation/v1/ad_unit/${id}?${fieldsParam}`;

    const { response, data } = await safeFetchJson(url, {
      headers: { 'Api-Key': apiKey },
    });

    if (!response.ok) {
      const message = extractMessageFromAppLovin(data, response.status);
      return res.status(response.status).json({ success: false, error: message });
    }

    return res.json(data);
  } catch (err) {
    return res.status(503).json({ success: false, error: formatError(err) });
  }
});

// POST to Ad Unit
app.post('/ad-unit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.headers['api-key'];
    if (!apiKey) return res.status(400).json({ success: false, error: 'API Key is required' });

    const payload = req.body;
    const url = `https://o.applovin.com/mediation/v1/ad_unit/${id}`;

    const { response, data } = await safeFetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = extractMessageFromAppLovin(data, response.status);
      return res.status(response.status).json({ success: false, error: message });
    }

    return res.json(data);
  } catch (err) {
    return res.status(503).json({ success: false, error: formatError(err) });
  }
});

app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));
