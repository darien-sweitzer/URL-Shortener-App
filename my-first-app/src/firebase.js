const fetchJson = async (path, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = path;
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(
        `Firebase request failed (${response.status}): ${errorText || response.statusText}`
      );
      error.code = "firebase/http-error";
      error.status = response.status;
      error.details = errorText || response.statusText;
      error.url = url;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("API request timed out after 10 seconds.");
      timeoutError.code = "api/timeout";
      timeoutError.url = path;
      throw timeoutError;
    }

    if (!error.code) {
      error.code = "api/network-error";
      error.url = path;
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const createShortLink = (payload, timeoutMs = 10000) => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/shorten", true);
    request.timeout = timeoutMs;
    request.setRequestHeader("Content-Type", "application/json");

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        try {
          resolve(JSON.parse(request.responseText));
        } catch (error) {
          const parseError = new Error("API returned invalid JSON.");
          parseError.code = "api/parse-error";
          parseError.details = request.responseText;
          parseError.status = request.status;
          parseError.url = "/api/shorten";
          reject(parseError);
        }
        return;
      }

      const error = new Error(`API request failed (${request.status})`);
      error.code = "api/http-error";
      error.status = request.status;
      error.details = request.responseText;
      error.url = "/api/shorten";
      reject(error);
    };

    request.onerror = () => {
      const error = new Error("Network error while calling /api/shorten.");
      error.code = "api/network-error";
      error.url = "/api/shorten";
      reject(error);
    };

    request.ontimeout = () => {
      const error = new Error("API request timed out after 10 seconds.");
      error.code = "api/timeout";
      error.url = "/api/shorten";
      reject(error);
    };

    request.send(JSON.stringify(payload));
  });
};

export { createShortLink };
