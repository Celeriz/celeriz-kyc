const API_KEY = process.env.API_KEY || '758034';

// Get the correct base URL based on environment
const getBaseUrl = (req) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the request host
    return `https://${req.headers.host}`;
  }
  // In development, use localhost
  return 'http://localhost:3000';
};

// API Key validation
const validateApiKey = (req) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKey) {
    return { error: 'API key is required', message: 'Please provide X-API-Key in headers' };
  }
  
  if (apiKey !== API_KEY) {
    return { error: 'Invalid API key', message: 'The provided API key is not valid' };
  }
  
  return null;
};

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate API key
    const authError = validateApiKey(req);
    if (authError) {
      return res.status(401).json(authError);
    }

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
} 