/**
 * JavaScript Code Generator - Generates JavaScript code for all custom blocks
 */

// Helper function: Wrap async operation with stop checking
function wrapAsyncOperation(operation) {
    return `checkStopExecution();
await (async function() {
  ${operation}
  return true;
})()`;
}

// Code Generator: Send gait action command

// Use unified timeout configuration
const COMMAND_TIMEOUT_MAX = TIMEOUT_CONFIG.COMMAND.DEFAULT_TIMEOUT; // Default command timeout
const LONG_COMMAND_TIMEOUT = TIMEOUT_CONFIG.COMMAND.LONG_COMMAND_TIMEOUT; // Long command timeout
const ACROBATIC_MOVES_TIMEOUT = TIMEOUT_CONFIG.COMMAND.ACROBATIC_MOVES_TIMEOUT; // Acrobatic moves timeout
const JOINT_QUERY_TIMEOUT = TIMEOUT_CONFIG.COMMAND.JOINT_QUERY_TIMEOUT; // Joint query timeout

Blockly.JavaScript.forBlock["gait"] = function (block) {
    const cmd = block.getFieldValue("COMMAND");
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.ceil(delay * 1000);

    let code = `
checkStopExecution();
await (async function() {
  const __from = (typeof serialBuffer === 'string')
    ? serialBuffer.length
    : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
  await webRequest("${cmd}", 20000, true);
  // Wait for completion signal in serial mode: gait commands usually use 'k' as completion marker
  if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
    await waitForSerialTokenLine('k', 20000, __from);
  }
  // Record token received time (WiFi: webRequest resolves after receiving k; Serial: waitForSerialTokenLine returned)
  if (typeof window !== 'undefined') window.__lastTokenReceivedAt = Date.now();
  return true;
})()
`;

    if (delayMs > 0) {
        code += `await (async () => {
  const __tokenAt = (typeof window !== 'undefined' && typeof window.__lastTokenReceivedAt === 'number') ? window.__lastTokenReceivedAt : Date.now();
  const __endAt = __tokenAt + ${delayMs};
  const __checkInterval = 100;
  while (Date.now() < __endAt) {
    checkStopExecution();
    const __wait = Math.min(__checkInterval, __endAt - Date.now());
    if (__wait > 0) await new Promise(r => setTimeout(r, __wait));
  }
})();
`;
    }
    return code;
};

// Code Generator: Send posture action command (record time after receiving token and delay from that time)
Blockly.JavaScript.forBlock["posture"] = function (block) {
    const cmd = block.getFieldValue("COMMAND");
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.ceil(delay * 1000);

    let code = `
checkStopExecution();
await (async function() {
  const __from = (typeof serialBuffer === 'string')
    ? serialBuffer.length
    : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
  await webRequest("${cmd}", 10000, true);
  // Wait for completion signal in serial mode: 'k...' returns 'k'; 'd' (rest) returns 'd'
  if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
    const _tok = '${cmd}'.charAt(0);
    await waitForSerialTokenLine(_tok, 15000, __from);
  }
  if (typeof window !== 'undefined') window.__lastTokenReceivedAt = Date.now();
  return true;
})()
`;

    if (delayMs > 0) {
        code += `await (async () => {
  const __tokenAt = (typeof window !== 'undefined' && typeof window.__lastTokenReceivedAt === 'number') ? window.__lastTokenReceivedAt : Date.now();
  const __endAt = __tokenAt + ${delayMs};
  const __checkInterval = 100;
  while (Date.now() < __endAt) {
    checkStopExecution();
    const __wait = Math.min(__checkInterval, __endAt - Date.now());
    if (__wait > 0) await new Promise(r => setTimeout(r, __wait));
  }
})();
`;
    }
    return code;
};

// Code Generator: Play tone list
Blockly.JavaScript.forBlock["play_tone_list"] = function (block) {
    const toneList = block.getFieldValue("TONE_LIST");
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.round(delay * 1000);
    
    // Parse tone list
    const tones = toneList.split(',').map(t => t.trim());
    if (tones.length % 2 !== 0) {
        // If tone count is not even, add a default duration
        tones.push('4');
    }
    
    // Build tone array: [B, tone1, duration1, tone2, duration2, ..., 126]
    // B ASCII code is 66, end marker is 126
    const toneArray = [66]; // 'B'.charCodeAt(0) = 66
    for (let i = 0; i < tones.length; i += 2) {
        const tone = parseInt(tones[i]) || 0;
        const duration = parseInt(tones[i + 1]) || 4;
        toneArray.push(tone, duration);
    }
    toneArray.push(126); // End marker
    
    // Use byte array format with better error handling
    const command = `bytes:[${toneArray.join(',')}]`;
    let code = wrapAsyncOperation(`
        // Serial wait: record buffer length before sending to avoid hitting old token
        if (typeof window !== 'undefined') {
          const __sb = (typeof serialBuffer === 'string')
            ? serialBuffer
            : ((typeof window.serialBuffer === 'string') ? window.serialBuffer : '');
          window.__lastSerialStartIndex = __sb.length;
        }
        try {
            const result = await webRequest("${command}", 15000, true);
        } catch (error) {
            console.error(getText("debugToneListSendFailed"), error);
            // If byte array sending fails, try sending notes one by one
            ${generateFallbackNotes(tones)}
        }
    `) + '\n';
    // Serial mode: wait for serial to return 'B' (tone list complete) before starting delay timer
    code += `if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
  const __from = (typeof window !== 'undefined' && typeof window.__lastSerialStartIndex === 'number') ? window.__lastSerialStartIndex : undefined;
  await waitForSerialTokenLine('B', 15000, __from);
  if (typeof window !== 'undefined') window.__lastSerialStartIndex = null;
}
`;
    
    if (delayMs > 0) {
        // For long delays, check stop flag in segments
        if (delayMs > 100) {
            code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delayMs} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delayMs} - i * checkInterval)));
  }
})();
`;
        } else {
            code += `checkStopExecution();
await new Promise(resolve => setTimeout(resolve, ${delayMs}));
`;
        }
    }
    return code;
};

// Generate fallback note sending code helper function
function generateFallbackNotes(tones) {
    let fallbackCode = '';
    for (let i = 0; i < tones.length; i += 2) {
        const tone = parseInt(tones[i]) || 0;
        const duration = parseInt(tones[i + 1]) || 4;
        fallbackCode += `await webRequest("b ${tone} ${duration}", 5000, true);
            `;
    }
    return fallbackCode;
}

// Code Generator: Send acrobatic moves command (record time after receiving token and delay from that time)
Blockly.JavaScript.forBlock["acrobatic_moves"] = function (block) {
    const cmd = block.getFieldValue("COMMAND");
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.ceil(delay * 1000);

    let code = `
checkStopExecution();
await (async function() {
  const __from = (typeof serialBuffer === 'string')
    ? serialBuffer.length
    : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
  await webRequest("${cmd}", ${ACROBATIC_MOVES_TIMEOUT}, true);
  if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
    await waitForSerialTokenLine('k', ${ACROBATIC_MOVES_TIMEOUT}, __from);
  }
  if (typeof window !== 'undefined') window.__lastTokenReceivedAt = Date.now();
  return true;
})()
`;

    if (delayMs > 0) {
        code += `await (async () => {
  const __tokenAt = (typeof window !== 'undefined' && typeof window.__lastTokenReceivedAt === 'number') ? window.__lastTokenReceivedAt : Date.now();
  const __endAt = __tokenAt + ${delayMs};
  const __checkInterval = 100;
  while (Date.now() < __endAt) {
    checkStopExecution();
    const __wait = Math.min(__checkInterval, __endAt - Date.now());
    if (__wait > 0) await new Promise(r => setTimeout(r, __wait));
  }
})();
`;
    }
    return code;
};

// Code Generator: Behavior action command (same pattern as posture)
Blockly.JavaScript.forBlock["behavior"] = function (block) {
    const cmd = block.getFieldValue("COMMAND");
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.ceil(delay * 1000);

    let code = `
checkStopExecution();
await (async function() {
  const __from = (typeof serialBuffer === 'string')
    ? serialBuffer.length
    : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
  await webRequest("${cmd}", 10000, true);
  if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
    const _tok = '${cmd}'.charAt(0);
    await waitForSerialTokenLine(_tok, 15000, __from);
  }
  if (typeof window !== 'undefined') window.__lastTokenReceivedAt = Date.now();
  return true;
})()
`;

    if (delayMs > 0) {
        code += `await (async () => {
  const __tokenAt = (typeof window !== 'undefined' && typeof window.__lastTokenReceivedAt === 'number') ? window.__lastTokenReceivedAt : Date.now();
  const __endAt = __tokenAt + ${delayMs};
  const __checkInterval = 100;
  while (Date.now() < __endAt) {
    checkStopExecution();
    const __wait = Math.min(__checkInterval, __endAt - Date.now());
    if (__wait > 0) await new Promise(r => setTimeout(r, __wait));
  }
})();
`;
    }
    return code;
};

// Code Generator: Delay code generator
Blockly.JavaScript.forBlock["delay_ms"] = function (block) {
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.round(delay * 1000); // Convert seconds to milliseconds
    let code = `checkStopExecution();\nconsole.log(getText("delayMessage").replace("{delay}", ${delay}));\n`;
    if (delayMs > 0) {
        // For long delays, check stop flag in segments
        if (delayMs > 100) {
            code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delayMs} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delayMs} - i * checkInterval)));
  }
})();
`;
        } else {
            code += `checkStopExecution();\nawait new Promise(resolve => setTimeout(resolve, ${delayMs}));\n`;
        }
    }
    return code;
};

// Code Generator: Gyro control code generator
Blockly.JavaScript.forBlock["gyro_control"] = function (block) {
    const state = block.getFieldValue("STATE");
    const value = state === "1" ? "B" : "b";
    const command = encodeCommand("g", [value]);
    return wrapAsyncOperation(`const result = await webRequest("${command}", 5000, true);`) + '\n';
};

// Code Generator: Get sensor input code generator
Blockly.JavaScript.forBlock["get_sensor_input"] = function (block) {
    var sensor = block.getFieldValue("SENSOR");
    return [
        `(async () => { checkStopExecution(); return parseInt(await webRequest("${sensor}", 5000, true)) || 0; })()`,
        Blockly.JavaScript.ORDER_FUNCTION_CALL,
    ];
};

// Code Generator: Send custom command code generator
Blockly.JavaScript.forBlock["send_custom_command"] = function (block) {
    const command = Blockly.JavaScript.valueToCode(
        block,
        "COMMAND",
        Blockly.JavaScript.ORDER_ATOMIC
    );
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.round(delay * 1000);
    let code = wrapAsyncOperation(`
      if (typeof window !== 'undefined') {
        const __sb = (typeof serialBuffer === 'string')
          ? serialBuffer
          : ((typeof window.serialBuffer === 'string') ? window.serialBuffer : '');
        window.__lastSerialStartIndex = __sb.length;
      }
      const result = await webRequest(${command}, ${LONG_COMMAND_TIMEOUT}, true);
    `) + '\n';
    // If custom command starts with 'm'/'k'/'d', wait for corresponding completion marker in serial mode; otherwise skip
    code += `if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') { try { 
  const _c = ${command}; 
  const _t = (typeof _c === 'string' && _c.length>0) ? _c[0] : null; 
  if (_t && ('mkd'.includes(_t))) { 
    const __from = (typeof window !== 'undefined' && typeof window.__lastSerialStartIndex === 'number') ? window.__lastSerialStartIndex : undefined;
    await waitForSerialTokenLine(_t, ${LONG_COMMAND_TIMEOUT}, __from); 
  } 
  if (typeof window !== 'undefined') window.__lastSerialStartIndex = null;
} catch(e) {} }\n`;
    if (delayMs > 0) {
        // For long delays, check stop flag in segments
        if (delayMs > 100) {
            code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delayMs} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delayMs} - i * checkInterval)));
  }
})();
`;
        } else {
            code += `checkStopExecution();\nawait new Promise(resolve => setTimeout(resolve, ${delayMs}));\n`;
        }
    }
    return code;
};

// Code Generator: Console log variable code generator
Blockly.JavaScript.forBlock["console_log_variable"] = function (block) {
    const variable =
        Blockly.JavaScript.valueToCode(
            block,
            "VARIABLE",
            Blockly.JavaScript.ORDER_NONE
        ) || '""';
    const trimmed = ("" + variable).trim();
    if (/\.length\s*$/.test(trimmed)) {
        const baseExpr = trimmed.replace(/\.length\s*$/, "");
        return `await (async () => {\nconst __baseTmp = ${baseExpr};\nconst __baseVal = (__baseTmp && typeof __baseTmp.then === 'function') ? await __baseTmp : __baseTmp;\nconst __len = (Array.isArray(__baseVal) || typeof __baseVal === 'string') ? __baseVal.length : 0;\nconsole.log(__len);\n})();\n`;
    }
    return `await (async () => {\nconst __tmp = ${variable};\nconst __val = (__tmp && typeof __tmp.then === 'function') ? await __tmp : __tmp;\nif (Array.isArray(__val)) {\n  const __text = __val.length === 0\n    ? '[ ]'\n    : '[' + __val.map(v => {\n        if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);\n        return String(v);\n      }).join(',') + ']';\n  console.log(__text);\n} else {\n  console.log(__val);\n}\n})();\n`;
};

// Code Generator: Play note code generator
Blockly.JavaScript.forBlock["play_note"] = function (block) {
    const note = block.getFieldValue("NOTE");
    const duration = block.getFieldValue("DURATION");
    return wrapAsyncOperation(`const result = await webRequest("b ${note} ${duration}", 5000, true);`) + '\n';
};

// Code Generator: Play melody code generator
Blockly.JavaScript.forBlock["play_melody"] = function (block) {
    const statements = Blockly.JavaScript.statementToCode(block, "MELODY");
    // Convert statements to command string
    const params = statements
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
            // Extract note and duration from each line of code
            const match = line.match(/b\s+(\d+)\s+(\d+)/);
            if (match) {
                return [parseInt(`${match[1]}`), parseInt(`${match[2]}`)];
            }
            return [];
        })
        .filter((item) => item.length == 2);
    const cmdParams = params.flat();
    
    // Generate base64 encoded actual command
    let encodeCmd = encodeCommand("B", cmdParams);
    
    // Generate readable display format
    let displayCmd = `B ${cmdParams.join(" ")}`;
    
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.ceil(delay * 1000);
    let code = wrapAsyncOperation(`
      if (typeof window !== 'undefined') {
        const __sb = (typeof serialBuffer === 'string')
          ? serialBuffer
          : ((typeof window.serialBuffer === 'string') ? window.serialBuffer : '');
        window.__lastSerialStartIndex = __sb.length;
      }
      const result = await webRequest("${encodeCmd}", ${LONG_COMMAND_TIMEOUT}, true, "${displayCmd}");
    `) + '\n';
    // Serial mode: wait for serial to return 'B' (melody complete) before starting delay timer
    code += `if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') { 
  const __from = (typeof window !== 'undefined' && typeof window.__lastSerialStartIndex === 'number') ? window.__lastSerialStartIndex : undefined;
  await waitForSerialTokenLine('B', ${LONG_COMMAND_TIMEOUT}, __from); 
  if (typeof window !== 'undefined') window.__lastSerialStartIndex = null;
}\n`;
    if (delayMs > 0) {
        // For long delays, check stop flag in segments
        if (delayMs > 100) {
            code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delayMs} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delayMs} - i * checkInterval)));
  }
})();
`;
        } else {
            code += `checkStopExecution();\nawait new Promise(resolve => setTimeout(resolve, ${delayMs}));\n`;
        }
    }
    return code;
};

javascript.javascriptGenerator.forBlock["set_joints_angle_seq"] = function (
    block
) {
    const token = "m";
    const variableText = Blockly.JavaScript.valueToCode(
        block,
        "VARIABLE",
        Blockly.JavaScript.ORDER_ATOMIC
    );
    const delay = block.getFieldValue("DELAY");
    let code = `
checkStopExecution();
await (async function() {
  const __from = (typeof serialBuffer === 'string') ? serialBuffer.length : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
  const command = await encodeMoveCommand("${token}", ${variableText});
  await webRequest(command, ${COMMAND_TIMEOUT_MAX}, true);
  if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
    await waitForSerialTokenLine('m', 15000, __from);
  }
  return true;
})()
`
    const delayMs = Math.ceil(delay * 1000);
    if (delayMs > 0) {
        // For long delays, check stop flag in segments
        if (delayMs > 100) {
            code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delayMs} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delayMs} - i * checkInterval)));
  }
})();
`;
        } else {
            code += `checkStopExecution();\nawait new Promise(resolve => setTimeout(resolve, ${delayMs}));\n`;
        }
    }
    return code;
};

javascript.javascriptGenerator.forBlock["set_joints_angle_sim"] = function (
    block
) {
    const token = "i";
    const delay = block.getFieldValue("DELAY");
    const variableText = Blockly.JavaScript.valueToCode(
        block,
        "VARIABLE",
        Blockly.JavaScript.ORDER_ATOMIC
    );
    let code = `
checkStopExecution();
await (async function() {
  const __from = (typeof serialBuffer === 'string') ? serialBuffer.length : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
  const command = await encodeMoveCommand("${token}", ${variableText});
  await webRequest(command, ${COMMAND_TIMEOUT_MAX}, true);
  if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
    await waitForSerialTokenLine('i', 30000, __from);
  }
  return true;
})()
`
    const delayMs = Math.ceil(delay * 1000);
    if (delayMs > 0) {
        // For long delays, check stop flag in segments
        if (delayMs > 100) {
            code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delayMs} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delayMs} - i * checkInterval)));
  }
})();
`;
        } else {
            code += `checkStopExecution();\nawait new Promise(resolve => setTimeout(resolve, ${delayMs}));\n`;
        }
    }
    return code;
};

javascript.javascriptGenerator.forBlock["set_joints_angle_sim_raw"] = function (
    block
) {
    const token = "L";
    const variableText = Blockly.JavaScript.valueToCode(
        block,
        "VARIABLE",
        Blockly.JavaScript.ORDER_ATOMIC
    );
    const variable = eval(variableText).filter((item) => item !== null);
    if (variable.length == 0) {
        return `console.log("set_joints_angle_sim: variable is empty");\n`;
    } else {
        let angleParams = [];
        if (Array.isArray(variable[0])) {
            // variable is array of [[jointId, angle], [jointId, angle], ...]
            angleParams = variable.flat();
        } else if (Number.isInteger(variable[0])) {
            // variable is array of [jointId, angle, jointId, angle, ...]
            angleParams = variable;
        }

        const delay = block.getFieldValue("DELAY");
        const delayMs = Math.ceil(delay * 1000);
        const command = encodeCommand(token, angleParams);
        let code = wrapAsyncOperation(`const result = await webRequest("${command}", 30000, true);`) + '\n';
        if (delayMs > 0) {
            // For long delays, check stop flag in segments
            if (delayMs > 100) {
                code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delayMs} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delayMs} - i * checkInterval)));
  }
})();
`;
            } else {
                code += `checkStopExecution();\nawait new Promise(resolve => setTimeout(resolve, ${delayMs}));\n`;
            }
        }
        return code;
    }
};

javascript.javascriptGenerator.forBlock["joints_angle_frame_raw"] = function (
    block
) {
    const variable = block.getFieldValue("VARIABLE");
    return [`[${variable}]`, Blockly.JavaScript.ORDER_ATOMIC];
};

// Code Generator: Set motor angle code generator
javascript.javascriptGenerator.forBlock["set_joint_angle"] = function (block) {
    const variableText = Blockly.JavaScript.valueToCode(
        block,
        "VARIABLE",
        Blockly.JavaScript.ORDER_ATOMIC
    );
    const token = "m";
    let code = `
checkStopExecution();
await (async function() {
  const __from = (typeof serialBuffer === 'string') ? serialBuffer.length : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
  const command = await encodeMoveCommand("${token}", ${variableText});
  await webRequest(command, ${COMMAND_TIMEOUT_MAX}, true);
  if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
    await waitForSerialTokenLine('m', 15000, __from);
  }
  return true;
})()
`
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.ceil(delay * 1000);
    if (delayMs > 0) {
        // For long delays, check stop flag in segments
        if (delayMs > 100) {
            code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delayMs} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delayMs} - i * checkInterval)));
  }
})();
`;
        } else {
            code += `checkStopExecution();\nawait new Promise(resolve => setTimeout(resolve, ${delayMs}));\n`;
        }
    }
    return code;
};

javascript.javascriptGenerator.forBlock["joint_absolute_angle_value"] =
    function (block) {
        const jointId = block.getFieldValue("JOINT");
        const angle = Blockly.JavaScript.valueToCode(
            block,
            "ANGLE",
            Blockly.JavaScript.ORDER_ATOMIC
        );
        return [`[${jointId}, ${angle}]`, Blockly.JavaScript.ORDER_ATOMIC];
    };


javascript.javascriptGenerator.forBlock["joint_relative_angle_value"] =
    function (block) {
        const jointId = block.getFieldValue("JOINT");
        const angleSign = block.getFieldValue("ANGLE_SIGN");
        const angle = Blockly.JavaScript.valueToCode(
            block,
            "ANGLE",
            Blockly.JavaScript.ORDER_ATOMIC
        );
        return [
            `[${jointId}, ${angleSign}, ${angle}]`,
            Blockly.JavaScript.ORDER_ATOMIC,
        ];
    };

// Code Generator: Get joint angle code generator
javascript.javascriptGenerator.forBlock["get_joint_angle"] = function (block) {
    const jointId = block.getFieldValue("JOINT");
    const command = encodeCommand("j", [jointId]);
    return [
        `(async () => { checkStopExecution(); return parseInt(await webRequest("${command}", 5000, true)) || 0; })()`,
        Blockly.JavaScript.ORDER_FUNCTION_CALL,
    ];
};

// Code Generator: Get all joint angles code generator
javascript.javascriptGenerator.forBlock["get_all_joint_angles"] = function (
    block
) {
    const command = "j";
    let code = `
await (async function() {
  checkStopExecution();
  const rawResult = await webRequest("${command}", 5000, true);
  const result = parseAllJointsResult(rawResult);
  return result;
})()
`;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// Arm action block code generator (record time after receiving token and delay from that time)
javascript.javascriptGenerator.forBlock["arm_action"] = function (block) {
    const cmd = block.getFieldValue("COMMAND");
    const delay = block.getFieldValue("DELAY");
    const delayMs = Math.ceil(delay * 1000);

    let code = `
checkStopExecution();
await (async function() {
  const __from = (typeof serialBuffer === 'string')
    ? serialBuffer.length
    : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
  await webRequest("${cmd}", ${LONG_COMMAND_TIMEOUT}, true);
  if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
    const _tok = '${cmd}'.charAt(0);
    await waitForSerialTokenLine(_tok, ${LONG_COMMAND_TIMEOUT}, __from);
  }
  if (typeof window !== 'undefined') window.__lastTokenReceivedAt = Date.now();
  return true;
})()
`;

    if (delayMs > 0) {
        code += `await (async () => {
  const __tokenAt = (typeof window !== 'undefined' && typeof window.__lastTokenReceivedAt === 'number') ? window.__lastTokenReceivedAt : Date.now();
  const __endAt = __tokenAt + ${delayMs};
  const __checkInterval = 100;
  while (Date.now() < __endAt) {
    checkStopExecution();
    const __wait = Math.min(__checkInterval, __endAt - Date.now());
    if (__wait > 0) await new Promise(r => setTimeout(r, __wait));
  }
})();
`;
    }
    return code;
};

// Code Generator: Execute skill file
javascript.javascriptGenerator.forBlock["action_skill_file"] = function (
    block
) {
    const filename = block.getFieldValue("FILENAME");
    // Delay unit is seconds, need to convert to milliseconds
    const delay = parseInt(block.getFieldValue("DELAY") * 1000);
    const skillData = window.uploadedSkills.find(
        (skill) => skill.name === filename
    );
    if (!skillData) {
        return `console.log("Skill file not found: ${filename}");\n`;
    }
    const skillContent = skillData.content;
    const token = skillContent.token;
    const list = skillContent.data.flat();
    const cmd = encodeCommand(token, list);
    let code = wrapAsyncOperation(`
      if (typeof window !== 'undefined') {
        const __sb = (typeof serialBuffer === 'string')
          ? serialBuffer
          : ((typeof window.serialBuffer === 'string') ? window.serialBuffer : '');
        window.__lastSerialStartIndex = __sb.length;
      }
      const result = await webRequest("${cmd}", ${LONG_COMMAND_TIMEOUT}, true);
    `) + '\n';
    // Serial mode: wait for corresponding completion marker based on skill file token type
    code += `if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') { 
  const __from = (typeof window !== 'undefined' && typeof window.__lastSerialStartIndex === 'number') ? window.__lastSerialStartIndex : undefined;
  await waitForSerialTokenLine('${token}', ${LONG_COMMAND_TIMEOUT}, __from); 
  if (typeof window !== 'undefined') window.__lastSerialStartIndex = null;
}\n`;
    if (delay > 0) {
        // For long delays, check stop flag in segments
        if (delay > 100) {
            code += `await (async () => {
  const checkInterval = 100; // Check every 100ms
  const totalChecks = Math.ceil(${delay} / checkInterval);
  for (let i = 0; i < totalChecks; i++) {
    checkStopExecution();
    await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, ${delay} - i * checkInterval)));
  }
})();
`;
        } else {
            code += `checkStopExecution();\nawait new Promise(resolve => setTimeout(resolve, ${delay}));\n`;
        }
    }
    return code;
};

// Connect robot code generation
javascript.javascriptGenerator.forBlock["make_connection"] = function (block) {
    const ip = block.getFieldValue("IP_ADDRESS");
    return `
try {
  const connectionResult = await makeConnection("${ip}");
  if(connectionResult) {
    deviceIP = "${ip}";
    console.log(getText("connectedToDevice") + deviceIP);
    window.__gesturePollIntervalMs = 600;
  } else {
    console.log(getText("debugConnectionFailed"));
  }
} catch (error) {
  console.error(getText("debugConnectionError"), error.message);
}\n`;
};

// Code Generator: Set analog output block
Blockly.JavaScript.forBlock["set_analog_output"] = function (
    block
) {
    const pin = block.getFieldValue("PIN");
    const value = Blockly.JavaScript.valueToCode(block, "VALUE", Blockly.JavaScript.ORDER_ATOMIC) || "128";
    return wrapAsyncOperation(`const analogValue = ${value}; const command = encodeCommand("Wa", ["${pin}", analogValue]); const result = await webRequest(command, 5000, true);`) + '\n';
};

// Code Generator: Set digital output code
Blockly.JavaScript.forBlock["set_digital_output"] = function (
    block
) {
    const pin = block.getFieldValue("PIN");
    const value = block.getFieldValue("STATE");
    const command = encodeCommand("Wd", [pin, value]);
    return wrapAsyncOperation(`const result = await webRequest("${command}", 5000, true);`) + '\n';
};

// Code Generator: Get digital input code generator - only auto print under showDebug
Blockly.JavaScript.forBlock["get_digital_input"] = function (block) {
    const pin = block.getFieldValue("PIN");
    const command = encodeCommand("Rd", [pin]);
    let code = `await (async function() {
    checkStopExecution();
    const rawResult = await webRequest("${command}", 5000, true);
    const result = parseSingleResult(rawResult);
    // Only print result in showDebug mode
    if (typeof showDebug !== 'undefined' && showDebug) {
      console.log(result);
    }
    return result;
  })()`;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// Code Generator: Get analog input code generator - only auto print under showDebug
Blockly.JavaScript.forBlock["get_analog_input"] = function (block) {
    const pin = block.getFieldValue("PIN");
    const command = encodeCommand("Ra", [pin]);
    let code = `await (async function() {
    checkStopExecution();
    const rawResult = await webRequest("${command}", 5000, true);
    const result = parseSingleResult(rawResult);
    // Only print result in showDebug mode
    if (typeof showDebug !== 'undefined' && showDebug) {
      console.log(result);
    }
    return result;
  })()`;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// Code Generator: Universal input block (digital/analog dropdown + pin number input)
Blockly.JavaScript.forBlock["get_input"] = function (block) {
    const type = block.getFieldValue("TYPE");
    const pin = block.getFieldValue("PIN");
    const commandType = type === "digital" ? "Rd" : "Ra";
    const command = encodeCommand(commandType, [pin]);
    let code = `await (async function() {
    checkStopExecution();
    const rawResult = await webRequest("${command}", 5000, true);
    let result = parseSingleResult(rawResult);
    // For digital input, non-zero numbers automatically convert to 1 (or true)
    if ("${type}" === "digital") {
      result = result !== 0 ? 1 : 0;
    }
    // Only print result in showDebug mode
    if (typeof showDebug !== 'undefined' && showDebug) {
      console.log(result);
    }
    return result;
  })()`;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// Code Generator: Universal output block (digital/analog dropdown + pin number input + Value number input)
Blockly.JavaScript.forBlock["set_output"] = function (block) {
    const type = block.getFieldValue("TYPE");
    const pin = block.getFieldValue("PIN");
    const valueCode = Blockly.JavaScript.valueToCode(block, "VALUE", Blockly.JavaScript.ORDER_ATOMIC) || "0";
    const commandType = type === "digital" ? "Wd" : "Wa";
    // For digital output, non-zero numbers automatically convert to 1 (handled at runtime)
    if (type === "digital") {
        return wrapAsyncOperation(`const value = ${valueCode}; const digitalValue = value !== 0 ? 1 : 0; const command = encodeCommand("${commandType}", ["${pin}", digitalValue]); const result = await webRequest(command, 5000, true);`) + '\n';
    } else {
        return wrapAsyncOperation(`const analogValue = ${valueCode}; const command = encodeCommand("${commandType}", ["${pin}", analogValue]); const result = await webRequest(command, 5000, true);`) + '\n';
    }
};

// Code Generator: Console input code generator
Blockly.JavaScript.forBlock["console_input"] = function (block) {
    const prompt = block.getFieldValue("PROMPT");
    let code = `await (async function() {
    checkStopExecution();
    // Check if using default prompt text, if so use current language translation
    const promptText = "${prompt}";
    const finalPrompt = (promptText === getText("consoleInputDefaultPrompt") ||
                        promptText === "Please input:" ||
                        promptText === "Please input:" ||
                        promptText === "Please input:") ?
                       getText("consoleInputDefaultPrompt") : promptText;
    const result = await window.consoleInput(finalPrompt);
    return result;
  })()`;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// Code Generator: Get ultrasonic sensor distance block - only auto print under showDebug
Blockly.JavaScript.forBlock["getUltrasonicDistance"] = function (
    block
) {
    const trPin = block.getFieldValue("TRPIN");
    const ecPinValue = block.getFieldValue("ECPIN");
    const ecPin = ecPinValue === "-1" ? trPin : ecPinValue;
    const command = encodeCommand("XU", [trPin, ecPin]);
    let code = `await (async function() {
    checkStopExecution();
    const rawResult = await webRequest("${command}", 5000, true);
    const result = parseSingleResult(rawResult);
    // Only print result in showDebug mode
    if (typeof showDebug !== 'undefined' && showDebug) {
      console.log(result);
    }
    return result;
  })()`;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// Code Generator: Read camera coordinate block
// {
//   "type": "event_cam",
//   "x": -20.5,      // X offset from center
//   "y": 15.0,       // Y offset from center
//   "width": 50,     // Target width
//   "height": 50,    // Target height
//   "timestamp": 1234567890
// }
Blockly.JavaScript.forBlock["getCameraCoordinate"] = function (
    block
) {
    let code = `
await (async function() {
  checkStopExecution();
  // Only activate camera before first coordinate retrieval
  if (typeof window === 'undefined' || !window.__cameraActivated) {
    await webRequest("XCr", 5000, true);
    if (typeof window !== 'undefined') window.__cameraActivated = true;
  }
  checkStopExecution();
  // Send get command only once initially, serial response is mirrored by serial read hook
  if (typeof window === 'undefined' || !window.__cameraPolled) {
    await webRequest("XCP", 5000, true);
    if (typeof window !== 'undefined') window.__cameraPolled = true;
  }
  // Only return when "new frame" coordinates are detected; otherwise return empty array
  const beforeKey = (typeof window !== 'undefined' && window.__lastCameraFrameKey) ? window.__lastCameraFrameKey : '';
  if (typeof window !== 'undefined') { window.__cameraQueryActive = true; window.__mirrorCameraToConsole = false; window.__cameraMirrorDone = false; }
  let coords = [];
  try {
    if (typeof waitForNewCameraCoordinates === 'function') {
      coords = await waitForNewCameraCoordinates(beforeKey, 1000);
    } else {
      coords = [];
    }
  } finally {
    if (typeof window !== 'undefined') { window.__cameraQueryActive = false; window.__mirrorCameraToConsole = false; }
  }
  if (Array.isArray(coords) && coords.length === 4) {
    // If serial captured the frame arrival timestamp, use it to print once in Console first
    if (typeof window !== 'undefined' && typeof addConsoleMessageAt === 'function' && window.__lastCameraTs && window.__lastCameraCoords) {
      try { addConsoleMessageAt([[String(coords[0]), String(coords[1]), String(coords[2]), String(coords[3])].join(',')], window.__lastCameraTs); } catch (e) {}
      window.__lastCameraTs = null; window.__lastCameraCoords = null;
    }
    return coords;
  }
  return [];
})()
`;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// NEW: Gesture sensor read block code generator
Blockly.JavaScript.forBlock["get_gesture_value"] = function (block) {
    let code = `
await (async function() {
  checkStopExecution();
  // First entry into gesture mode (WiFi devices may respond slowly or with different formats, failure doesn't interrupt task, still mark as attempted and continue polling XGp)
  if (typeof window === 'undefined' || !window.__gestureActivated) {
    try {
      // Enable gesture sensor, but disable firmware auto reaction (use lowercase r)
      // XGr~ (lowercase r + terminator) = disable firmware auto reaction, let Blockly program control actions
      // XGR~ (uppercase R + terminator) = enable firmware auto reaction, firmware auto-executes built-in action sequences
      // Note: Uppercase letter commands must end with ~
      await webRequest("XGr~", 5000, true);
      // Wait for firmware settings to take effect
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) console.warn('XGr~ (gesture enable) failed, continuing with XGp poll:', e && e.message ? e.message : e);
    }
    if (typeof window !== 'undefined') window.__gestureActivated = true;
  }
  checkStopExecution();

  // Send single query command XGp (lowercase p) every time to get current gesture value
  // Note: In WiFi (WebSocket) mode, gesture value is returned directly as webRequest return string;
  // In serial mode, may return full response or placeholder text, fallback to serialBuffer parsing.
  //
  // Performance optimization (especially important for WiFi mode):

  if (typeof window !== 'undefined') {
    const __now = Date.now();
    

    const __minInterval = (typeof window.__gesturePollIntervalMs === 'number')
      ? window.__gesturePollIntervalMs
      : 500;
    if (typeof window.__lastGesturePollTs !== 'number') {
      window.__lastGesturePollTs = 0;
    }
    if (__now - window.__lastGesturePollTs < __minInterval) {
      // Throttling period: wait remaining time, then return -1 (avoid reusing cached gesture value)
      const __waitTime = __minInterval - (__now - window.__lastGesturePollTs);
      if (__waitTime > 0 && __waitTime < 10000) {
        await new Promise(r => setTimeout(r, __waitTime));
      }
      return -1;
    }
    if (window.__gesturePollInFlight) {
      // Single flight protection: wait 100ms then return -1
      await new Promise(r => setTimeout(r, 100));
      return -1;
    }
    window.__gesturePollInFlight = true;
    window.__lastGesturePollTs = __now;
  }

  let rawGesture = null;
  const __xgpTimeout = 1000;
  try {
    // XGp~ (uppercase letter command needs ~ terminator, lowercase p = single gesture value query)
    rawGesture = await webRequest("XGp~", __xgpTimeout, true);
  } catch (e) {
    // Critical: Don't interrupt entire program when XGp occasional timeout/disconnect,
    // just treat this reading as "no gesture", let loop continue, subsequent exit_gesture_mode can execute.
    rawGesture = null;
  } finally {
    if (typeof window !== 'undefined') {
      window.__gesturePollInFlight = false;
    }
  }

  // Parse returned gesture value (prioritize parsing rawGesture; fallback to buffer parsing if necessary)
  let gestureValue = -1;
  try {
    // WiFi: if injected webRequest didn't expand array, handle compatibility here: single element array take first element
    if (Array.isArray(rawGesture) && rawGesture.length > 0) {
      rawGesture = rawGesture[0];
    }
    // 1) Priority: parse from webRequest return value (WiFi mode always uses this)
    if (typeof rawGesture === 'number') {
      gestureValue = rawGesture;
    } else if (typeof rawGesture === 'string' && rawGesture.length > 0) {
      // parseSingleResult extracts first parseable number from string (WiFi device returns "=\\r\\nnumber\\r\\n" format)
      if (typeof parseSingleResult === 'function') {
        gestureValue = parseSingleResult(rawGesture);
      } else {
        // Use \\d here to avoid some concatenation/escaping processes eating \d causing regex to fail
        const m = String(rawGesture).match(/-?\\d+/);
        gestureValue = m ? parseInt(m[0], 10) : -1;
      }
    }

    // 2) Fallback: only for serial mode take latest frame from buffer; WiFi has no buffer, don't wait 200ms to maintain real-time performance
    const __hasSerialBuffer = (typeof serialBuffer !== 'undefined' && typeof serialBuffer === 'string') || (typeof window !== 'undefined' && typeof window.serialBuffer === 'string');
    if (![0, 1, 2, 3].includes(gestureValue) && __hasSerialBuffer) {
      if (typeof serialBuffer !== 'undefined' && typeof serialBuffer === 'string' && serialBuffer.length > 5000) {
        serialBuffer = serialBuffer.substring(serialBuffer.length - 3000);
      } else if (typeof window !== 'undefined' && typeof window.serialBuffer === 'string' && window.serialBuffer.length > 5000) {
        window.serialBuffer = window.serialBuffer.substring(window.serialBuffer.length - 3000);
      }
      await new Promise(r => setTimeout(r, 200));
      if (typeof getLatestGestureNoWait === 'function') {
        const result = getLatestGestureNoWait();
        if (result && result.value !== null && result.value !== undefined) {
          gestureValue = result.value;
        }
      }
    }
  } catch (e) {
    gestureValue = -1;
  }

  // Only accept 0/1/2/3, treat others as no gesture
  if (![0, 1, 2, 3].includes(gestureValue)) {
    gestureValue = -1;
  }

  // Cache last frame (so "skip polling" in WiFi still has value available)
  if (typeof window !== 'undefined') {
    window.__lastGestureValue = gestureValue;
    window.__lastGestureValueTs = Date.now();
  }

  // Return gesture value (0=Up, 1=Down, 2=Left, 3=Right, -1=No gesture)
  return gestureValue;
})()
`;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// NEW: Exit gesture recognition mode block code generator
Blockly.JavaScript.forBlock["exit_gesture_mode"] = function (block) {
    let code = `
await (async function() {
  checkStopExecution();
  
  // Helper function: wait for specific response (for WebSocket and serial communication)
  async function waitForResponse(expectedValue, timeout = 5000) {
    const startTime = Date.now();
    const checkInterval = 50; // Check every 50ms
    
    return new Promise((resolve, reject) => {
      const checkResponse = () => {
        checkStopExecution();
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Wait for response timeout'));
          return;
        }
        
        // Get buffer data (support WebSocket and serial)
        let buffer = '';
        if (typeof window !== 'undefined' && window.__isSerialMode) {
          // Serial mode
          if (typeof serialBuffer !== 'undefined' && typeof serialBuffer === 'string') {
            buffer = serialBuffer;
          } else if (typeof window !== 'undefined' && typeof window.serialBuffer === 'string') {
            buffer = window.serialBuffer;
          }
        } else {
          // WebSocket mode
          if (typeof serialBuffer !== 'undefined' && typeof serialBuffer === 'string') {
            buffer = serialBuffer;
          }
        }
        
        if (buffer) {
          // Split by line, find matching response
          const lines = buffer.split(/[\\r\\n]+/).map(l => l.trim());
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i] === expectedValue) {
              resolve(expectedValue);
              return;
            }
          }
        }
        
        // Continue waiting
        setTimeout(checkResponse, checkInterval);
      };
      
      checkResponse();
    });
  }
  
  try {
    // Send Xg~ command to exit gesture recognition mode (uppercase letter command needs ~ terminator)
    let response = await webRequest("Xg~", 5000, true);
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    
    // Check response (WebSocket mode may return directly, serial mode needs to read from buffer)
    let foundX = false;
    if (response && (typeof response === 'string' || typeof response === 'number')) {
      const responseStr = String(response);
      if (responseStr.includes('X') || responseStr.trim() === 'X') {
        foundX = true;
      }
    }
    
    // If WebSocket mode didn't find, or using serial mode, wait for "X" from buffer
    if (!foundX) {
      try {
        await waitForResponse('X', 3000);
      } catch (e) {
        // If timeout, continue (may have received response but didn't detect)
      }
    }
    
    // Reset initialization flag so next time can reinitialize
    if (typeof window !== 'undefined') {
      // Unified use of __gestureActivated (get_gesture_value uses it)
      window.__gestureActivated = false;
      window.__lastGestureFrameKey = '';
    }
  } catch (error) {
    console.error('Exit gesture recognition mode failed:', error);
  }
})();
`;
    return code;
};

function encodeCommand(token, params) {
    if (token.charCodeAt(0) >= 65 && token.charCodeAt(0) <= 90) {
        // Uppercase letter commands, send as bytes directly
        let byteArray = [];
        
        // Add token characters
        for (let i = 0; i < token.length; i++) {
            byteArray.push(token.charCodeAt(i));
        }
        
        // Add parameters
        for (let i = 0; i < params.length; i++) {
            // Ensure negative numbers convert to two's complement
            byteArray.push(params[i] & 0xff);
        }
        
        // Uppercase letter commands add '~' character at end (ASCII 126)
        byteArray.push(126);
        
        // Return byte array identifier and array
        return "bytes:" + JSON.stringify(byteArray);
    } else {
        // Lowercase letter commands, process as original method
        if (params.length > 0) {
            return `${token}${params.join(" ")}`;
        } else {
            return token;
        }
    }
}

function decodeCommand(content) {
    // Decode base64 encoded command
    if (content.startsWith("b64:")) {
        const base64Data = content.substring(4); // Remove "b64:" prefix
        const bufferText = atob(base64Data);
        const buffer = new Uint8Array(bufferText.length);
        for (let i = 0; i < bufferText.length; i++) {
            buffer[i] = bufferText.charCodeAt(i);
        }

        // Read token (first character)
        const token = bufferText.charAt(0);
        const params = new Int8Array(buffer.buffer, 1, buffer.length - 1);
        return {
            token: token,
            params: params,
        };
    }
    const command = content.split(" ");
    // If not base64 encoded, return original content
    return {
        token: content.charAt(0),
        params: command.slice(1).map((item) => parseInt(item)),
    };
}

function parseSingleResult(rawResult) {
    // Check if rawResult is null or undefined
    if (!rawResult) {
        console.warn('parseSingleResult: rawResult is null or undefined');
        return 0;
    }
    
    // If rawResult is already a number, return directly
    if (typeof rawResult === 'number') {
        return rawResult;
    }
    
    // First try to extract number after = sign (support device returning "=\r\nnumber\r\n" or "=\nnumber\n" format)
    if (typeof rawResult === 'string' && rawResult.includes("=")) {
        const lines = rawResult.split(/\r?\n/).map(function (s) { return s.trim(); });
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === "=" && i + 1 < lines.length) {
                const num = parseInt(lines[i + 1], 10);
                if (!isNaN(num)) {
                    return num;
                }
            }
        }
    }

    // Try to extract number from single-line format, like "4094 R"
    if (typeof rawResult === 'string') {
        const words = rawResult.trim().split(/\s+/);
        for (const word of words) {
            const num = parseInt(word);
            if (!isNaN(num)) {
                return num;
            }
        }
    }

    return 0;
}

// Parse camera coordinates
// =
//-23.00 20.00 size = 42 56
//X
function parseCameraCoordinateResult(rawResult) {
    // Internal universal parsing: supports two formats
    // 1) Old format (line 0 is coordinates, line 2 is 'X', uses Tab separator)
    // 2) New format (line 0 is '=', line 1 is "x y size = w h", line 2 is 'X')
    function extractFromText(text) {
        if (!text) return [];
        const norm = String(text).replace(/\r\n/g, "\n");
        const lines = norm.split("\n").map(l => l.trim()).filter(l => l.length > 0);

        // Priority match new format block:
        // =\ncoordinate line\nX
        // Where coordinate line is like "-65.00 -2.00 size = 97 138"
        // Take last frame match (avoid always getting old frame when slice has multiple frames)
        const blockRegex = /=\s*\n([^\n]+)\nX/gi;
        let blockMatch = null;
        let lastMatch = null;
        while ((blockMatch = blockRegex.exec(norm)) !== null) {
            lastMatch = blockMatch;
        }
        if (lastMatch && lastMatch[1]) {
            const mid = lastMatch[1];
            const coordsRegex = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+size\s*=\s*(\d+)\s+(\d+)/i;
            const m = mid.match(coordsRegex);
            if (m) {
                const x = parseFloat(m[1]);
                const y = parseFloat(m[2]);
                const w = parseFloat(m[3]);
                const h = parseFloat(m[4]);
                if ([x, y, w, h].every(v => !Number.isNaN(v))) {
                    return [x, y, w, h];
                }
            }
        }

        // Fallback match old format: line 2 contains X, coordinates in line 0 (Tab separator, indexes 0, 1, 4, 5)
        if (lines.length >= 3 && /x/i.test(lines[2])) {
            const args = lines[0].split(/\t+/);
            if (args.length >= 6) {
                const x = parseFloat(args[0]);
                const y = parseFloat(args[1]);
                const width = parseFloat(args[4]);
                const height = parseFloat(args[5]);
                if ([x, y, width, height].every(v => !Number.isNaN(v))) {
                    return [x, y, width, height];
                }
            }
        }
        return [];
    }

    // 1) Try to parse passed rawResult (WebSocket path usually returns full text)
    let parsed = extractFromText(rawResult);
    if (parsed.length === 4) return parsed;

    // 2) Serial path: webRequest("XCP") may return placeholder text (like "Command sent via serial").
    //    Fallback to parse latest frame coordinate block from global serial buffer (prefer global binding serialBuffer, then window.serialBuffer).
    try {
        let buf = '';
        if (typeof serialBuffer !== 'undefined' && typeof serialBuffer === 'string') {
            buf = serialBuffer;
        } else if (typeof window !== 'undefined' && typeof window.serialBuffer === 'string') {
            buf = window.serialBuffer;
        }
        if (buf && buf.length > 0) {
            // Only use buffer tail to improve hit rate and performance
            const tail = buf.slice(-2000);
            parsed = extractFromText(tail);
            if (parsed.length === 4) return parsed;
        }
    } catch (e) {
        // Ignore exceptions in fallback parsing
    }

    // 3) Still no valid data parsed
    return [];
}

// Poll wait for coordinate data frame to appear in serial buffer (= / coords / X)
async function waitForCameraCoordinates(timeoutMs = 1000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const parsed = parseCameraCoordinateResult("");
        if (Array.isArray(parsed) && parsed.length === 4) {
            return parsed;
        }
        await new Promise(r => setTimeout(r, 50));
    }
    return [];
}

// Extract latest frame coordinates from serial buffer (try to use last frame as much as possible, avoid getting old frame)
function getLatestCameraCoordinatesNoWait() {
    try {
        let buf = '';
        if (typeof serialBuffer !== 'undefined' && typeof serialBuffer === 'string') {
            buf = serialBuffer;
        } else if (typeof window !== 'undefined' && typeof window.serialBuffer === 'string') {
            buf = window.serialBuffer;
        }
        if (!buf) return { coords: [], key: '' };

        const norm = String(buf).replace(/\r\n/g, "\n");
        // Priority: three-line frame with X as end marker
        let lastXMatch = null;
        const xRegex = /(^|\n)X(\n|$)/g;
        let m;
        while ((m = xRegex.exec(norm)) !== null) {
            lastXMatch = { index: m.index + (m[1] ? m[1].length : 0) };
        }
        if (lastXMatch) {
            const xIndex = lastXMatch.index;
            const coordsEnd = xIndex; // Coordinate line is one line before X
            const coordsStart = norm.lastIndexOf('\n', coordsEnd - 1) + 1;
            if (!(coordsStart < 0 || coordsStart >= coordsEnd)) {
                const coordsLine = norm.substring(coordsStart, coordsEnd).trim();
                const eqEnd = coordsStart - 1;
                const eqStart = norm.lastIndexOf('\n', eqEnd - 1) + 1;
                const eqLine = eqStart >= 0 ? norm.substring(eqStart, eqEnd).trim() : '';
                const coordsRegex = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+size\s*=\s*(\d+)\s+(\d+)/i;
                const c = coordsLine.match(coordsRegex);
                if (c) {
                    const x = parseFloat(c[1]);
                    const y = parseFloat(c[2]);
                    const w = parseFloat(c[3]);
                    const h = parseFloat(c[4]);
                    if ([x, y, w, h].every(v => !Number.isNaN(v))) {
                        const key = `${eqLine}|${coordsLine}|X@${coordsStart}`;
                        return { coords: [x, y, w, h], key };
                    }
                }
            }
        }
        // Fallback: support single-line coordinates (no X marker). Take last matched line
        const coordsRegexGlobal = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+size\s*=\s*(\d+)\s+(\d+)/gi;
        let match, last = null;
        while ((match = coordsRegexGlobal.exec(norm)) !== null) {
            last = { match, index: match.index };
        }
        if (last) {
            const x = parseFloat(last.match[1]);
            const y = parseFloat(last.match[2]);
            const w = parseFloat(last.match[3]);
            const h = parseFloat(last.match[4]);
            if ([x, y, w, h].every(v => !Number.isNaN(v))) {
                // Use matched line text and its start position as key to avoid confusion with old frame
                const line = last.match[0];
                const key = `${line}@${last.index}`;
                return { coords: [x, y, w, h], key };
            }
        }
        return { coords: [], key: '' };
    } catch (e) {
        return { coords: [], key: '' };
    }
}

async function waitForNewCameraCoordinates(prevKey, timeoutMs = 500) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const { coords, key } = getLatestCameraCoordinatesNoWait();
        if (key && key !== prevKey && Array.isArray(coords) && coords.length === 4) {
            if (typeof window !== 'undefined') {
                window.__lastCameraFrameKey = key;
            }
            return coords;
        }
        await new Promise(r => setTimeout(r, 20));
    }
    return [];
}

// ===== Gesture sensor parsing and waiting =====
function parseGestureValueFromText(text) {
    if (!text) return { value: null, key: '' };
    const norm = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    
    // Only match complete format =\nnumber\nX (supports -1, 0, 1, 2, 3)
    const frameRegex = /=\s*\n(-1|[0-3])?\s*\nX/gi;
    let match = null, lastMatch = null;
    while ((match = frameRegex.exec(norm)) !== null) {
        lastMatch = match;
    }
    if (lastMatch) {
        const digit = lastMatch[1];
        const val = (typeof digit !== 'undefined' && digit !== undefined && digit !== '') ? parseInt(digit, 10) : null;
        const key = `=${digit ?? ''}|X`;
        return { value: (val !== null && Number.isInteger(val)) ? val : null, key };
    }
    
    return { value: null, key: '' };
}

function getLatestGestureNoWait() {
    try {
        let buf = '';
        if (typeof serialBuffer !== 'undefined' && typeof serialBuffer === 'string') {
            buf = serialBuffer;
        } else if (typeof window !== 'undefined' && typeof window.serialBuffer === 'string') {
            buf = window.serialBuffer;
        }
        if (!buf) return { value: null, key: '' };
        const tail = buf.slice(-2000);
        return parseGestureValueFromText(tail);
    } catch (e) {
        return { value: null, key: '' };
    }
}

async function waitForNewGestureValue(prevKey, timeoutMs = 500) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const { value, key } = getLatestGestureNoWait();
        if (key && key !== prevKey) {
            if (typeof window !== 'undefined') {
                window.__lastGestureFrameKey = key;
            }
            if (value === null || value === undefined) {
                return -1;
            }
            return value;
        }
        await new Promise(r => setTimeout(r, 5));
    }
    return -1;
}

// rawResult may be one of two formats:
// Old format: "0\t1\t2\t...\n0,\t0,\t0,\t...\nj\n"
// New format: "=\n0 1 2 3 ...\n-1, -1, 0, 0, ...\nj\n"
function parseAllJointsResult(rawResult) {
    if (typeof showDebug !== 'undefined' && showDebug) {
        console.log(getText('debugParseAllJointsStart'), typeof rawResult);
        console.log(getText('debugParseAllJointsRawLength'), rawResult ? rawResult.length : 0);
    }
    
    // Check if rawResult is null or undefined
    if (!rawResult) {
        console.warn('parseAllJointsResult: rawResult is null or undefined');
        return [];
    }
    
    const lines = rawResult.split("\n").map(line => line.trim());
    if (typeof showDebug !== 'undefined' && showDebug) {
        console.log(getText('debugParseAllJointsSplitLines'), lines.length);
        console.log(getText('debugParseAllJointsLineContent'), JSON.stringify(lines));
    }
    
    // Find end marker 'j' position
    let jIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === 'j') {
            jIndex = i;
            break;
        }
    }
    
    if (jIndex < 0) {
        console.warn('parseAllJointsResult: End marker "j" not found');
        return [];
    }
    
    // New format: = \n index line \n angle line \n j
    if (jIndex >= 3 && lines[jIndex - 3] === '=') {
        const indexLine = lines[jIndex - 2];
        const angleLine = lines[jIndex - 1];
        
        // Index line separated by space
        const indexs = indexLine
            .split(/\s+/)
            .filter((item) => item.length > 0)
            .map((num) => parseInt(num));
        
        // Angle line separated by ", "
        const angles = angleLine
            .split(/,\s*/)
            .filter((item) => item.length > 0)
            .map((num) => parseInt(num));
        
        if (angles.length > 0) {
            return angles;
        }
    }
    
    // Old format: index line \n angle line \n j (compatibility support)
    if (jIndex >= 2) {
        const indexLine = lines[jIndex - 2];
        const angleLine = lines[jIndex - 1];
        
        // Try to separate by \t
        const indexs = indexLine
            .split("\t")
            .filter((item) => item.length > 0)
            .map((num) => parseInt(num));
        
        const angles = angleLine
            .split(",\t")
            .filter((item) => item.length > 0)
            .map((num) => parseInt(num));
        
        if (angles.length > 0) {
            return angles;
        }
    }
    
    console.warn('parseAllJointsResult: Unable to parse joint angle data');
    return [];
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateRelativeMoveSimCode(joints, params) {
    let status = Array.from(joints);
    let joinIndexs = new Set();
    for (let i = 0; i < params.length; i++) {
        const args = params[i];
        if (args.length == 3) {
            const jointId = args[0];
            const angleSign = args[1];
            const angle = args[2];
            const updatedAngle = status[jointId] + angleSign * angle;
            status[jointId] = Math.max(Math.min(updatedAngle, 125), -125);
            joinIndexs.add(jointId);
        } else if (args.length == 2) {
            const jointId = args[0];
            const angle = args[1];
            status[jointId] = angle;
            joinIndexs.add(jointId);
        }
    }
    // Map array [angle0, angle1, ...] to [index0, angle0, index1, angle1, ...]
    let result = [];
    joinIndexs.forEach((index) => {
        result.push(index, status[index]);
    });
    return result;
}

function generateRelativeMoveSeqCode(joints, params) {
    let status = Array.from(joints);
    let angleParams = [];
    params.forEach((args) => {
        const jointId = args[0];
        if (args.length == 3) {
            const angleSign = args[1];
            const angle = args[2];
            const updatedAngle = status[jointId] + angleSign * angle;
            status[jointId] = Math.max(Math.min(updatedAngle, 125), -125);
        } else if (args.length == 2) {
            const angle = args[1];
            status[jointId] = angle;
        }
        angleParams.push(jointId, status[jointId]);
    });
    return angleParams;
}

async function encodeMoveCommand(token, params) {
    if (Array.isArray(params) && params.length > 0) {
        let joints = Array(16).fill(0);
        let jointArgs = params.filter((item) => item !== null);
        if (Number.isInteger(jointArgs[0])) {
            jointArgs = [jointArgs];
        }
        const hasRelative = jointArgs.some((item) => item.length == 3);
        if (hasRelative) {
            if (typeof showDebug !== 'undefined' && showDebug) {
                console.log(getText('debugDetectedRelativeAngles'));
            }
            try {
                // In serial mode, webRequest is redirected to serialRequest
                // So can directly use webRequest, it will automatically call correct function
                const isSerialMode = (typeof window !== 'undefined' && window.__isSerialMode === true);
                if (typeof showDebug !== 'undefined' && showDebug) {
                    console.log(getText('debugCurrentMode'), isSerialMode ? getText('debugSerialMode') : getText('debugWiFiMode'));
                }
                let rawResult;
                rawResult = await webRequest("j", JOINT_QUERY_TIMEOUT, true);
                if (typeof showDebug !== 'undefined' && showDebug) {
                    console.log(getText('debugQueryJCommandRaw'), rawResult);
                }
                const result = parseAllJointsResult(rawResult);
                if (typeof showDebug !== 'undefined' && showDebug) {
                    console.log(getText('debugParsedJointAngles'), result);
                }
                // Check if query result is valid
                if (result && result.length > 0) {
                    joints = result;
                    if (typeof showDebug !== 'undefined' && showDebug) {
                        console.log(getText('debugSuccessGetJointAngles'), result.length);
                    }
                } else {
                    console.warn(getText('debugCannotGetJointAngles'));
                    // joints remains Array(16).fill(0)
                }
            } catch (error) {
                console.error(getText('debugWaitJointAnglesError'), error);
                console.warn(getText('debugUseDefaultJointAngles'));
            }
        }
        let command = "";
        // m: move seq
        if (token.toLowerCase() == "m") {
            const cmdArgs = generateRelativeMoveSeqCode(joints, jointArgs);
            command = encodeCommand(token, cmdArgs);
        } else {
            const cmdArgs = generateRelativeMoveSimCode(joints, jointArgs);
            command = encodeCommand(token, cmdArgs);
        }
        return command;
    } else {
        return token;
    }
}

// HTTP request function for use in generated code - for mock testing only
function mockwebRequest(ip, command, returnResult = false) {
    // Add identifier prefix to command for debugging without changing original command behavior
    const debugCommand = "[MOCK]" + command;
    // console.log(getText("mockRequest") + `${debugCommand} -> ${ip}`);

    // Return different mock values for different commands
    if (returnResult) {
        // Mock device model query
        if (command === "?") {
            // console.warn(getText("usingMockwebRequest"));
            return "PetoiModel-v1.0";
        }

        // Mock sensor, digital and analog input responses
        if (
            command.startsWith("Ra") ||
            command.startsWith("Rd") ||
            command.startsWith("i ") ||
            command.includes(" ?")
        ) {
            return "123";
        }
    }

    return returnResult ? "0" : true; // Default return value
}

// Loop block code generator - add stop checking
Blockly.JavaScript.forBlock["controls_repeat_ext"] = function(block) {
    const repeats = Blockly.JavaScript.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const branch = Blockly.JavaScript.statementToCode(block, 'DO');
    const code = `
for (let i = 0; i < ${repeats}; i++) {
  await checkStopExecutionInLoop();
  ${branch}
}`;
    return code;
};

Blockly.JavaScript.forBlock["controls_whileUntil"] = function(block) {
    const until = block.getFieldValue('MODE') === 'UNTIL';
    const argument0 = Blockly.JavaScript.valueToCode(block, 'BOOL', Blockly.JavaScript.ORDER_NONE) || 'false';
    const branch = Blockly.JavaScript.statementToCode(block, 'DO');
    const code = `
while (${until ? '!' : ''}(${argument0})) {
  await checkStopExecutionInLoop();
  ${branch}
}`;
    return code;
};

Blockly.JavaScript.forBlock["controls_for"] = function(block) {
    const variable0 = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const argument0 = Blockly.JavaScript.valueToCode(block, 'FROM', Blockly.JavaScript.ORDER_NONE) || '0';
    const argument1 = Blockly.JavaScript.valueToCode(block, 'TO', Blockly.JavaScript.ORDER_NONE) || '0';
    const increment = Blockly.JavaScript.valueToCode(block, 'BY', Blockly.JavaScript.ORDER_NONE) || '1';
    const branch = Blockly.JavaScript.statementToCode(block, 'DO');
    const code = `
for (let ${variable0} = ${argument0}; ${variable0} <= ${argument1}; ${variable0} += ${increment}) {
  await checkStopExecutionInLoop();
  ${branch}
}`;
    return code;
};

Blockly.JavaScript.forBlock["controls_forEach"] = function(block) {
    const variable0 = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const argument0 = Blockly.JavaScript.valueToCode(block, 'LIST', Blockly.JavaScript.ORDER_NONE) || '[]';
    const branch = Blockly.JavaScript.statementToCode(block, 'DO');
    const code = `
for (const ${variable0} of ${argument0}) {
  await checkStopExecutionInLoop();
  ${branch}
}`;
    return code;
};

// Code Generator: Random number block
Blockly.JavaScript.forBlock["math_random"] = function(block) {
    const from = block.getFieldValue("FROM");
    const to = block.getFieldValue("TO");
    const type = block.getFieldValue("TYPE");
    
    let code;
    if (type === "Integer") {
        // Generate integer random number
        code = `Math.floor(Math.random() * (${to} - ${from} + 1)) + ${from}`;
    } else {
        // Generate decimal random number
        code = `Math.random() * (${to} - ${from}) + ${from}`;
    }

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// AI code generation block code generator
Blockly.JavaScript.forBlock["ai_code_generate"] = function (block) {
    const description = block.getFieldValue("DESCRIPTION");
    // Escape description safely to prevent code injection
    const safeDescription = description.replace(/[\\"'\n\r]/g, function(m) {
        return m === '\\' ? '\\\\' :
               m === '"' ? '\\"' :
               m === "'" ? "\\'" :
               m === '\n' ? '\\n' :
               m === '\r' ? '\\r' : m;
    });

    // Generate code to call AI service and execute generated code
    let code = `
await (async function() {
    checkStopExecution();
    const desc = "${safeDescription}";
    console.log(getText("aiCodeGenerateRequest").replace("{description}", desc));

    let generatedCode = "";
    try {
        // Call AI code generation service
        generatedCode = await window.generateAICode(desc);
        if (generatedCode && generatedCode.trim()) {
            console.log(getText("aiCodeGeneratedSuccess"));
            // Execute generated code
            await (async function() {
                if (desc.includes("repeat") || desc.includes("loop")) {
                    console.log("Note: Generated code may contain loops - execution will respect stop signals");
                }
                try {
                    // Use eval to safely execute generated code
                    // First create a context containing all necessary helper functions
                    // sendAndWait: send command and wait for robot completion token
                    async function __sendAndWait(cmd, timeout, token) {
                      const _wr = (typeof window !== 'undefined' && window.webRequest) ? window.webRequest : webRequest;
                      const __from = (typeof serialBuffer === 'string')
                        ? serialBuffer.length
                        : ((typeof window !== 'undefined' && typeof window.serialBuffer === 'string') ? window.serialBuffer.length : undefined);
                      await _wr(cmd, timeout, true);
                      if (!((typeof window !== 'undefined') && window.petoiClient) && typeof waitForSerialTokenLine === 'function') {
                        await waitForSerialTokenLine(token, timeout, __from);
                      }
                      if (typeof window !== 'undefined') window.__lastTokenReceivedAt = Date.now();
                    }
                    // delayAfterToken: delay starting from when robot completed
                    async function __delayAfterToken(ms) {
                      const __tokenAt = (typeof window !== 'undefined' && typeof window.__lastTokenReceivedAt === 'number') ? window.__lastTokenReceivedAt : Date.now();
                      const __endAt = __tokenAt + ms;
                      while (Date.now() < __endAt) {
                        checkStopExecution();
                        const __wait = Math.min(100, __endAt - Date.now());
                        if (__wait > 0) await new Promise(r => setTimeout(r, __wait));
                      }
                    }
                    const execContext = {
                        sendAndWait: __sendAndWait,
                        delayAfterToken: __delayAfterToken,
                        checkStopExecution: checkStopExecution,
                        checkStopExecutionInLoop: checkStopExecutionInLoop,
                        webRequest: (typeof window !== 'undefined' && window.webRequest) ? window.webRequest : webRequest,
                        waitForSerialTokenLine: (typeof waitForSerialTokenLine === 'function') ? waitForSerialTokenLine : undefined,
                        delay: delay,
                        encodeCommand: encodeCommand,
                        parseSingleResult: parseSingleResult,
                        parseAllJointsResult: parseAllJointsResult,
                        console: console,
                        getText: getText,
                        window: window,
                        document: document,
                        setTimeout: setTimeout,
                        clearTimeout: clearTimeout,
                        Promise: Promise,
                        parseInt: parseInt,
                        parseFloat: parseFloat,
                        Math: Math,
                        Date: Date,
                        Array: Array,
                        Object: Object,
                        String: String,
                        Number: Number,
                        JSON: JSON,
                        Error: Error,
                        isNaN: isNaN,
                        isFinite: isFinite,
                        undefined: undefined
                    };
                    // Bind context to generated code
                    const contextKeys = Object.keys(execContext);
                    const contextValues = contextKeys.map(k => execContext[k]);
                    const wrappedCode = "(async function(" + contextKeys.join(",") + ") {\\n" +
                        "try {\\n" +
                        generatedCode +
                        "\\n} catch(e) { console.error('Generated code error:', e); throw e; }\\n" +
                        "})";
                    const asyncFunc = eval(wrappedCode);
                    await asyncFunc.apply(null, contextValues);
                } catch (genError) {
                    console.error(getText("aiCodeExecutionError").replace("{error}", genError.message));
                }
            })();
        } else {
            console.warn(getText("aiCodeGenerateEmpty"));
        }
    } catch (error) {
        console.error(getText("aiCodeGenerateError").replace("{error}", error.message));
    }
})();
`;
    return code;
};
