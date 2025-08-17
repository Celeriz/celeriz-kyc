import React, { useEffect, useState } from "react";
import { OnrampWebSDK } from "@onramp.money/onramp-web-sdk";

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");

  // Get API URL based on environment
  const getApiUrl = () => {
    if (window.location.hostname === "localhost") {
      return "http://localhost:3001/api/kyc-url";
    }
    return `${window.location.origin}/api/kyc-url`;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCustomerId = urlParams.get("customerId");
    const kycUrl = urlParams.get("kycUrl");
    let id = urlCustomerId;

    if (!id) {
      const pathParts = window.location.pathname.split("/");
      const pathCustomerId = pathParts[pathParts.length - 1];
      if (pathCustomerId && pathCustomerId !== "") {
        id = pathCustomerId;
      }
    }

    if (!id) {
      setError("Access restricted. Please use a valid customer URL.");
      return;
    }

    setCustomerId(id);

    const fetchWidgetUrl = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(getApiUrl(), {
          method: "POST",
          headers: {
            "X-API-Key": "758034",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: id,
            kycUrl: kycUrl,
          }),
        });

        const data = await response.json();

        if (data.success) {
          const onrampSDK = new OnrampWebSDK({
            appId: data.data.sdkConfig.appId,
            widgetUrl: data.data.sdkConfig.widgetUrl,
          });

          setTimeout(() => {
            onrampSDK.show();
          }, 100);
        } else {
          setError(data.message || "Failed to fetch widget URL");
        }
      } catch (err) {
        setError("Failed to connect to API");
      } finally {
        setLoading(false);
      }
    };

    fetchWidgetUrl();
  }, []);

  // Show restricted access message if no customer ID
  if (!customerId && error.includes("Access restricted")) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>🚫 Access Restricted</h3>
        <p>This page is not accessible directly.</p>
        <p>Please use a valid customer URL format:</p>
        {/* <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '20px auto' }}>
          <li><code>https://kyc.celeriz.com/customer123</code></li>
          <li><code>https://kyc.celeriz.com/?customerId=customer123</code></li>
        </ul> */}
        {/* <p style={{ fontSize: '12px', color: '#666' }}>
          API Endpoint: POST {getApiUrl()}<br/>
         
        </p> */}
      </div>
    );
  }

  // Show loading or error, but keep it minimal
  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !error.includes("Access restricted")) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  // Return absolutely nothing - just the widget will be shown
  return null;
}

export default App;
