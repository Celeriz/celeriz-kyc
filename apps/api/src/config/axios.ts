import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';
import * as CryptoJS from 'crypto-js';

dotenv.config();

const onrampApi: AxiosInstance = axios.create({
  baseURL: `${process.env.ONRAMP_API_BASE_URL}/onramp/api`,
});

onrampApi.interceptors.request.use((req) => {
  const timestamp = Date.now().toString();

  const obj: {
    body: any;
    timestamp: string;
  } = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    body: req.data || {},
    timestamp,
  };

  const payload = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(JSON.stringify(obj)),
  );

  const signature = CryptoJS.enc.Hex.stringify(
    CryptoJS.HmacSHA512(payload, process.env.ONRAMP_API_SECRET!),
  );

  req.headers.set('apiKey', process.env.ONRAMP_API_KEY);
  req.headers.set('payload', payload);
  req.headers.set('signature', signature);
  req.headers.set('timestamp', timestamp);
  req.headers['Content-Type'] = 'application/json';

  return req;
});

export default onrampApi;
