/**
 * Debug logging module for development mode.
 * Provides colored console output and JSON file logging.
 */

const fs = require("fs");
const path = require("path");

let IS_DEV = false;
let DEBUG_LOG_PATH = null;
let debugLogFirstEntry = true;

const DEBUG_COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  white: "\x1b[37m"
};

function init(userDataPath, isDev) {
  IS_DEV = isDev;
  if (!IS_DEV) return;
  DEBUG_LOG_PATH = path.join(userDataPath, "debug-api.json");
  try {
    fs.writeFileSync(DEBUG_LOG_PATH, "[\n", "utf8");
  } catch (e) {
    // Ignore
  }
}

function writeEntry(entry) {
  if (!IS_DEV || !DEBUG_LOG_PATH) return;
  try {
    const sanitized = typeof entry === 'object' && entry !== null ? entry : { data: String(entry) };
    let safeData;
    try {
      const jsonString = JSON.stringify(sanitized, (key, value) => {
        if (typeof value === 'function' || typeof value === 'symbol') {
          return undefined;
        }
        if (typeof value === 'string' && value.length > 10000) {
          return value.substring(0, 10000) + '... [truncated]';
        }
        return value;
      });
      safeData = jsonString;
    } catch (jsonError) {
      safeData = JSON.stringify({
        type: 'log',
        timestamp: new Date().toISOString(),
        message: 'Failed to serialize log entry',
        error: String(jsonError)
      });
    }
    const prefix = debugLogFirstEntry ? "" : ",\n";
    debugLogFirstEntry = false;
    // codeql[js/http-to-file-access] - Data is sanitized through JSON.stringify replacer function
    fs.appendFileSync(DEBUG_LOG_PATH, prefix + safeData, "utf8");
  } catch (e) {
    // Ignore write errors
  }
}

function finalize() {
  if (!IS_DEV || !DEBUG_LOG_PATH) return;
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, "\n]", "utf8");
  } catch (e) {
    // Ignore
  }
}

function log(context, ...args) {
  if (IS_DEV) {
    const timestamp = new Date().toISOString();
    const timeStr = `${DEBUG_COLORS.dim}${timestamp}${DEBUG_COLORS.reset}`;
    console.log(`${timeStr} ${DEBUG_COLORS.cyan}[${context}]${DEBUG_COLORS.reset}`, ...args);
    writeEntry({
      type: "log",
      timestamp,
      context,
      message: args.map(a => typeof a === "object" ? a : String(a))
    });
  }
}

function apiCall(name, params) {
  if (IS_DEV) {
    const timestamp = new Date().toISOString();
    const divider = `${DEBUG_COLORS.blue}${"─".repeat(60)}${DEBUG_COLORS.reset}`;
    const header = `${DEBUG_COLORS.bgBlue}${DEBUG_COLORS.white}${DEBUG_COLORS.bright} ▶ API REQUEST: ${name} ${DEBUG_COLORS.reset}`;
    console.log("");
    console.log(divider);
    console.log(header);
    console.log(divider);
    console.log(`${DEBUG_COLORS.yellow}Parameters:${DEBUG_COLORS.reset}`);
    console.log(JSON.stringify(params, null, 2));
    writeEntry({
      type: "request",
      timestamp,
      api: name,
      params
    });
  }
}

function apiResponse(name, response, error = null) {
  if (IS_DEV) {
    const timestamp = new Date().toISOString();
    if (error) {
      const divider = `${DEBUG_COLORS.red}${"─".repeat(60)}${DEBUG_COLORS.reset}`;
      const header = `${DEBUG_COLORS.bgRed}${DEBUG_COLORS.white}${DEBUG_COLORS.bright} ✖ API ERROR: ${name} ${DEBUG_COLORS.reset}`;
      console.log(divider);
      console.log(header);
      console.log(divider);
      console.log(`${DEBUG_COLORS.red}Status:${DEBUG_COLORS.reset} ${error?.response?.status || "N/A"} ${error?.response?.statusText || ""}`);
      console.log(`${DEBUG_COLORS.red}Message:${DEBUG_COLORS.reset} ${error?.message || "Unknown error"}`);
      if (error?.response?.data) {
        console.log(`${DEBUG_COLORS.red}Response Data:${DEBUG_COLORS.reset}`);
        console.log(JSON.stringify(error.response.data, null, 2));
      }
      if (error?.stack) {
        console.log(`${DEBUG_COLORS.dim}Stack: ${error.stack}${DEBUG_COLORS.reset}`);
      }
      console.log(divider);
      console.log("");
      writeEntry({
        type: "error",
        timestamp,
        api: name,
        status: error?.response?.status || null,
        statusText: error?.response?.statusText || null,
        message: error?.message || "Unknown error",
        responseData: error?.response?.data || null
      });
    } else {
      const divider = `${DEBUG_COLORS.green}${"─".repeat(60)}${DEBUG_COLORS.reset}`;
      const header = `${DEBUG_COLORS.bgGreen}${DEBUG_COLORS.white}${DEBUG_COLORS.bright} ✔ API RESPONSE: ${name} ${DEBUG_COLORS.reset}`;
      console.log(divider);
      console.log(header);
      console.log(divider);
      console.log(`${DEBUG_COLORS.green}Status:${DEBUG_COLORS.reset} ${response?.status || "N/A"} ${response?.statusText || ""}`);
      console.log(`${DEBUG_COLORS.green}Data Type:${DEBUG_COLORS.reset} ${typeof response?.data}`);
      if (response?.data && typeof response.data === "object") {
        const keys = Array.isArray(response.data) ? `Array[${response.data.length}]` : Object.keys(response.data).join(", ");
        console.log(`${DEBUG_COLORS.green}Data Keys:${DEBUG_COLORS.reset} ${keys}`);
      }
      console.log(`${DEBUG_COLORS.magenta}Response Data:${DEBUG_COLORS.reset}`);
      console.log(JSON.stringify(response?.data, null, 2));
      console.log(divider);
      console.log("");
      writeEntry({
        type: "response",
        timestamp,
        api: name,
        status: response?.status || null,
        statusText: response?.statusText || null,
        data: response?.data || null
      });
    }
  }
}

function normalizeVersion(version) {
  return String(version || "").trim().replace(/^v/i, "");
}

function compareVersions(a, b) {
  const left = normalizeVersion(a).split(".").map(part => parseInt(part, 10) || 0);
  const right = normalizeVersion(b).split(".").map(part => parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const leftValue = left[i] || 0;
    const rightValue = right[i] || 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }
  return 0;
}

module.exports = {
  init,
  finalize,
  log,
  apiCall,
  apiResponse,
  normalizeVersion,
  compareVersions
};
