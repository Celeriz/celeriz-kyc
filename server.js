const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || '758034';

// Get the correct base URL based on environment
const getBaseUrl = (req) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the request host
    return `https://${req.get('host')}`;
  }
  // In development, use localhost
  return 'http://localhost:3000';
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key is required',
      message: 'Please provide X-API-Key in headers'
    });
  }
  
  // Validate API key (you can modify this logic)
  if (apiKey !== API_KEY) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
};

// POST endpoint to generate KYC URL and SDK config
app.post('/api/kyc-url', validateApiKey, (req, res) => {
  try {
    const { kycUrl, customerId } = req.body;
    
    // Validate required fields
    if (!customerId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'customerId is required in request body'
      });
    }
    
    if (!kycUrl) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'kycUrl is required in request body'
      });
    }
    
    // Use the provided kycUrl directly as widgetUrl for WebSDK
    const widgetUrl = kycUrl;
    
    // Get the correct base URL for this request
    const baseUrl = getBaseUrl(req);
    
    // Generate the local kycUrl in format: baseUrl/customerId
    const localKycUrl = `${baseUrl}/${customerId}`;
    
    // Return the SDK configuration and generated URL
    res.json({
      success: true,
      data: {
        kycUrl: localKycUrl,
        customerId: customerId,
        baseUrl: baseUrl,
        onrampKycUrl: kycUrl,
        sdkConfig: {
          appId: 12345,
          widgetUrl: widgetUrl
        }
      },
      message: 'KYC URL and SDK config generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating KYC URL:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate KYC URL'
    });
  }
});

// GET endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'KYC URL Generator API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: getBaseUrl(req)
  });
});

// Documentation endpoint
app.get('/api/docs', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    name: 'KYC URL Generator API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: baseUrl,
    endpoints: {
      'POST /api/kyc-url': {
        description: 'Generate SDK configuration using Onramp.money KYC URL',
        headers: {
          'X-API-Key': 'Required - Your API key',
          'Content-Type': 'application/json'
        },
        body: {
          customerId: 'Required - Customer ID',
          kycUrl: 'Required - Onramp.money KYC URL (will be used as widgetUrl)'
        },
        example: {
          headers: {
            'X-API-Key': '758034',
            'Content-Type': 'application/json'
          },
          body: {
            customerId: '12345',
            kycUrl: 'https://onramp.money/main/profile/?appId=1486284&kybData=d15bb9ae90ac307173d5f8858feb664e68e92912ddcb9260e08d116975a447e240cc2a63970e90bd4e0bb17ef3bac0a66f19745c52bab385b861b94e000ea796&closeAfterLogin=false'
          },
          response: {
            success: true,
            data: {
              kycUrl: `${baseUrl}/12345`,
              customerId: '12345',
              baseUrl: baseUrl,
              onrampKycUrl: 'https://onramp.money/main/profile/?appId=1486284&kybData=d15bb9ae90ac307173d5f8858feb664e68e92912ddcb9260e08d116975a447e240cc2a63970e90bd4e0bb17ef3bac0a66f19745c52bab385b861b94e000ea796&closeAfterLogin=false',
              sdkConfig: {
                appId: 12345,
                widgetUrl: 'https://onramp.money/main/profile/?appId=1486284&kybData=d15bb9ae90ac307173d5f8858feb664e68e92912ddcb9260e08d116975a447e240cc2a63970e90bd4e0bb17ef3bac0a66f19745c52bab385b861b94e000ea796&closeAfterLogin=false'
              }
            }
          }
        }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 KYC URL Generator API running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 