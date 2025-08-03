const path = require('path');
const fs = require('fs');
const os = require('os');




const getPreSigned = async (filename, length, token) => {
  try {
    const url = `https://slack.com/api/files.getUploadURLExternal?filename=${encodeURIComponent(filename)}&length=${length}`;

    // Attempt to fetch the URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.ok) {
      if (result.error && result.response_metadata && result.response_metadata.messages) {
        const errorMessage = result.response_metadata.messages.join(' ');
        throw new Error(`Slack getUploadURLExternal failed: ${result.error}. Details: ${errorMessage}`);
      } else {
        throw new Error(`Slack getUploadURLExternal failed: ${result.error}`);
      }
    }
    return result; 
  } catch (error) {
    if (error.name === 'TypeError') {
      console.error('Network error or unable to reach Slack API:', error.message);
      throw new Error('Network error or unable to reach Slack API');
    } else {
      console.error('Error occurred in getPreSigned:', error.message);
      throw error; 
    }
  }
};

const uploadToSlack = async (uploadUrl, fileBuffer) => {
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    const responseText = await response.text();
    if (responseText.startsWith("OK")) {
      console.log("Slack upload successful:", responseText);
    } else {
      throw new Error("Unexpected response from Slack at time of uploading to presign: " + responseText);
    }
  } catch (err) {
    if (err.name === 'TypeError') {
      console.error("Network error while uploading to Slack:", err.message);
      throw new Error("Network error while uploading to Slack: " + err.message);
    } else {
      console.error("Slack CSV upload failed:", err.message);
      throw err; 
    }
  }
};

const linkToChannel = async (fileId, title, channelId, token) => {
  try {
    const body = {
      files: [{ id: fileId, title }],
      channel_id: channelId,
    };

    const response = await fetch('https://slack.com/api/files.completeUploadExternal', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error("Slack API error:", result.error);
      const errorMessage = result.error || 'Unknown error occurred';
      throw new Error(`Slack completeUploadExternal fail - Attempting to send file to channel failed: ${errorMessage}`);
    }
    console.log('File linked to channel successfully:', result);
    return result;

  } catch (err) {
    if (err.name === 'TypeError') {
      console.error("Network error while linking to Slack channel:", err.message);
      throw new Error("Network error while linking to Slack channel: " + err.message);
    } else {
      console.error("Error linking file to Slack channel:", err.message);
      throw err;  
    }
  }
};

const generateCSVFormatData = (data) => {
  // Define the CSV header
  let csv = "Ad unit Id ,success,previous value,next value,Remarks\n";

  // Function to escape and wrap values with double quotes
  const escapeValue = (value) => {
    // If value contains commas, newlines, or quotes, escape it properly
    if (value && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
      return `"${value.replace(/"/g, '""')}"`; // Double quotes inside value are escaped as ""
    }
    return value;
  };

  // Iterate through the parent rows
  data.forEach((parent) => {

    // Iterate through subrows for the parent
    parent.subRows.forEach((subRow) => {
      // Add subrow under the parent row, filling nextValue and Remarks properly
      csv += `${(subRow.adUnitId)},${(subRow.isSuccess)},${escapeValue(subRow.previousValue)},${escapeValue(subRow.nextValue)},${escapeValue(subRow.errorMessage)}\n`;
    });
  });

  return csv;
};

const generateCSVFile = (unitData) => {
  try {
    const csvFormattedData = generateCSVFormatData(unitData);
    
    const fileName = `appbroda_idr.csv`;
    const csvFilePath = path.join(os.tmpdir(), fileName);

    fs.writeFileSync(csvFilePath, csvFormattedData);

    return csvFilePath;
  } catch (error) {
    console.error("Error generating CSV file:", error);
    throw error;
  }
};

const sendCsvToSlack = async (unitData) => {
  try {
    const csvFilePath = generateCSVFile(unitData);
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const stats = fs.statSync(csvFilePath);
    const fileSize = stats.size;
    const fileName = path.basename(csvFilePath);
    return {fileSize, csvData, fileName};
  } catch (error) {
    throw(error);
  }
};

const uploadCsvToSlackChannel = async (csvInputData, channelId, slackToken) => {
  // try {
  //   // Step 1: Generate CSV file, get buffer, name, size
  //   const { fileSize, csvData, fileName } = await sendCsvToSlack(csvInputData);
  //   const fileBuffer = Buffer.from(csvData, 'utf-8');

  //   // Step 2: Get presigned upload URL
  //   const uploadInfo = await getPreSigned(fileName, fileSize, slackToken);
  //   const uploadUrl = uploadInfo.upload_url;
  //   const fileId = uploadInfo.file_id;

  //   // Step 3: Upload file to Slack
  //   await uploadToSlack(uploadUrl, fileBuffer);

  //   // Step 4: Complete the upload and attach to the specified channel
  //   const completeRes = await linkToChannel(fileId, fileName, channelId, slackToken);

  //   console.log('Upload successful:', completeRes);
  // } catch (error) {
  //   console.error('Slack CSV upload failed:', error);
  //   throw(error);
  // }
};

const sendMessageToSlack = async (text, channel, slackToken) => {
  // try {
  //   const response = await fetch('https://slack.com/api/chat.postMessage', {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Bearer ${slackToken}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       text: text,
  //       channel: channel,
  //     }),
  //   });

  //   const data = await response.json();
  //   if (!data.ok) {
  //     const errorMessage = data.error || 'Unknown error occurred';
  //     console.error('Slack API error:', errorMessage);
  //     throw new Error(`Error sending message: ${errorMessage}`);
  //   }
  //   console.log('Message sent successfully:', data);
  //   return data;

  // } catch (error) {
  //   if (error.name === 'TypeError') {
  //     console.error('Network error while sending message to Slack:', error.message);
  //     throw new Error('Network error while sending message to Slack: ' + error.message);
  //   } else {
  //     console.error('Error sending message to Slack:', error.message);
  //     throw error; 
  //   }
  // }
};

module.exports =  { uploadCsvToSlackChannel, sendMessageToSlack };