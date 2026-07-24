# Requirements Document

## Introduction

This document specifies the requirements for a Logi Actions SDK plugin (Node.js/TypeScript) that bridges the Logitech MX Creative Console hardware with Kiro, an AI coding assistant running in VS Code/IDE. The plugin enables developers to send pre-defined prompts to Kiro via physical keypad buttons, control response tone via a rotary dial, and receive visual feedback (build status, test results) on the console's LCD buttons.

## Glossary

- **Plugin**: The Node.js process built with `@logitech/plugin-sdk` that connects to the Logi Plugin Service via WebSocket
- **Keypad**: The 9 LCD-equipped buttons on the MX Creative Console hardware
- **Dialpad**: The rotary dial (knob), roller, and associated buttons on the MX Creative Console hardware
- **Tone_Level**: A numeric value representing the criticism/supportiveness level that modifies prompt context, ranging from 1 (most supportive) to 10 (most critical)
- **Prompt_Mapping**: A configuration entry that associates a specific keypad button position (1-9) with a user-defined prompt string
- **Bridge**: A local communication channel (WebSocket or HTTP) between the Plugin and the VS Code extension that relays commands and status updates
- **Kiro_Extension**: The VS Code extension component that receives commands from the Bridge and interacts with Kiro's chat interface
- **LCD_Icon**: A visual indicator displayed on a keypad button's LCD screen representing status (color, icon)
- **Configuration_Store**: A persistent JSON file that stores user-customized prompt mappings, tone level, and button display settings
- **Logi_Plugin_Service**: The Logitech system service that manages plugin lifecycle, routes hardware events to plugins, and handles WebSocket communication

## Requirements

### Requirement 1: Plugin Initialization and Connection

**User Story:** As a developer, I want the plugin to automatically connect to the Logi Plugin Service on startup, so that hardware events are routed to the plugin without manual intervention.

#### Acceptance Criteria

1. WHEN the Logi Plugin Service starts the Plugin, THE Plugin SHALL establish a WebSocket connection to the Logi Plugin Service within 5 seconds
2. WHEN the Plugin connects successfully, THE Plugin SHALL register all 9 keypad buttons as CommandAction handlers
3. WHEN the Plugin connects successfully, THE Plugin SHALL register the dial as an AdjustmentAction handler
4. IF the WebSocket connection to Logi Plugin Service fails, THEN THE Plugin SHALL retry the connection with exponential backoff up to 5 attempts
5. IF all retry attempts are exhausted, THEN THE Plugin SHALL log an error message with the failure reason and terminate gracefully

### Requirement 2: Keypad Button Prompt Dispatch

**User Story:** As a developer, I want to press a keypad button and have the associated prompt sent to Kiro's chat, so that I can trigger AI actions without switching to the IDE.

#### Acceptance Criteria

1. WHEN a keypad button is pressed (onKeyDown event), THE Plugin SHALL retrieve the Prompt_Mapping for that button position
2. WHEN a valid Prompt_Mapping exists for the pressed button, THE Plugin SHALL prepend the current Tone_Level context to the prompt
3. WHEN the composed prompt is ready, THE Plugin SHALL send the composed prompt to the Kiro_Extension via the Bridge within 200ms of the button press
4. IF no Prompt_Mapping exists for the pressed button, THEN THE Plugin SHALL ignore the button press and log a debug message
5. IF the Bridge connection is unavailable, THEN THE Plugin SHALL display a red error LCD_Icon on the pressed button for 3 seconds

### Requirement 3: Dial Tone Control

**User Story:** As a developer, I want to rotate the dial to adjust the criticism level of Kiro's responses, so that I can control how critical or supportive the AI feedback is.

#### Acceptance Criteria

1. WHEN the dial is rotated clockwise (positive tick value), THE Plugin SHALL increase the Tone_Level by 1 per tick, up to a maximum of 10
2. WHEN the dial is rotated counter-clockwise (negative tick value), THE Plugin SHALL decrease the Tone_Level by 1 per tick, down to a minimum of 1
3. WHEN the Tone_Level changes, THE Plugin SHALL persist the new Tone_Level to the Configuration_Store
4. WHEN the Tone_Level changes, THE Plugin SHALL update the dial's LCD display to show the current Tone_Level value
5. THE Plugin SHALL initialize the Tone_Level to 5 (neutral) when no previous value exists in the Configuration_Store

### Requirement 4: Tone Level Prompt Composition

**User Story:** As a developer, I want the tone level to modify the context of prompts sent to Kiro, so that the AI responses match my desired feedback style.

#### Acceptance Criteria

1. WHILE the Tone_Level is between 1 and 3, THE Plugin SHALL prepend "Be supportive, encouraging, and constructive in your feedback." to the prompt
2. WHILE the Tone_Level is between 4 and 6, THE Plugin SHALL prepend "Be balanced and objective in your feedback." to the prompt
3. WHILE the Tone_Level is between 7 and 10, THE Plugin SHALL prepend "Be critical, direct, and uncompromising in your feedback. Point out every flaw." to the prompt
4. THE Plugin SHALL include the exact Tone_Level numeric value in the prepended context string

### Requirement 5: Prompt Mapping Configuration

**User Story:** As a developer, I want to customize which prompts are assigned to which keypad buttons, so that I can personalize the console for my workflow.

#### Acceptance Criteria

1. THE Plugin SHALL load Prompt_Mappings from the Configuration_Store on startup
2. WHEN no Configuration_Store file exists, THE Plugin SHALL create a default Configuration_Store with the following mappings:
   - Button 1: "Be honest, criticize. What's wrong with this code?"
   - Button 2: "Suggest a better alternative"
   - Button 3: "List the trade-offs of this approach"
   - Button 4: "Write test scenarios"
   - Button 5: "Refactor, apply SOLID principles"
   - Button 6: "Suggest performance optimization"
   - Button 7: "Explain this code in simple terms"
   - Button 8: "Find potential security issues"
   - Button 9: "Generate documentation for this code"
3. THE Plugin SHALL validate that each Prompt_Mapping contains a non-empty string of 500 characters or fewer
4. WHEN a user edits the Configuration_Store file externally, THE Plugin SHALL detect the change and reload mappings within 2 seconds
5. IF the Configuration_Store contains invalid data, THEN THE Plugin SHALL fall back to the default mappings and log a warning

### Requirement 6: Bridge Communication Setup

**User Story:** As a developer, I want the plugin to establish a communication channel with the VS Code extension, so that prompts and status updates flow between the hardware and the IDE.

#### Acceptance Criteria

1. WHEN the Plugin starts, THE Plugin SHALL start a local WebSocket server on a configurable port (default: 48321)
2. WHEN the Kiro_Extension connects to the Bridge WebSocket, THE Plugin SHALL acknowledge the connection and exchange a version handshake
3. IF the Kiro_Extension disconnects from the Bridge, THEN THE Plugin SHALL set all keypad LCD_Icons to a grey "disconnected" state
4. WHEN the Kiro_Extension reconnects to the Bridge, THE Plugin SHALL restore keypad LCD_Icons to their previous state
5. THE Plugin SHALL accept only local connections (127.0.0.1) on the Bridge WebSocket for security

### Requirement 7: Status Feedback on LCD Buttons

**User Story:** As a developer, I want to see build and test status on the keypad buttons, so that I have at-a-glance project health information without looking at the IDE.

#### Acceptance Criteria

1. WHEN the Kiro_Extension sends a "build_success" status event via the Bridge, THE Plugin SHALL display a green LCD_Icon on the designated status button
2. WHEN the Kiro_Extension sends a "build_failure" status event via the Bridge, THE Plugin SHALL display a red LCD_Icon on the designated status button
3. WHEN the Kiro_Extension sends a "test_pass" status event via the Bridge, THE Plugin SHALL display a green LCD_Icon on the designated test status button
4. WHEN the Kiro_Extension sends a "test_fail" status event via the Bridge, THE Plugin SHALL display a red LCD_Icon on the designated test status button with the failure count
5. WHEN the Kiro_Extension sends a "build_in_progress" status event via the Bridge, THE Plugin SHALL display an amber animated LCD_Icon on the designated status button

### Requirement 8: LCD Button Display Management

**User Story:** As a developer, I want each keypad button to display a meaningful label or icon, so that I can quickly identify what each button does.

#### Acceptance Criteria

1. WHEN the Plugin initializes, THE Plugin SHALL render a short label (up to 10 characters) on each keypad button LCD representing the assigned prompt category
2. THE Plugin SHALL support custom icon images (72x72 PNG) for each button position via the Configuration_Store
3. WHEN a button is pressed, THE Plugin SHALL briefly flash the button's LCD (200ms highlight) to provide tactile feedback confirmation
4. IF a custom icon file referenced in Configuration_Store does not exist, THEN THE Plugin SHALL display the text label fallback

### Requirement 9: Cross-Platform Compatibility

**User Story:** As a developer, I want the plugin to work on both Windows and macOS, so that I can use it regardless of my operating system.

#### Acceptance Criteria

1. THE Plugin SHALL use platform-agnostic file paths (using Node.js path module) for all Configuration_Store operations
2. THE Plugin SHALL function on Windows 10+ and macOS 12+ where Logi Plugin Service is supported
3. THE Plugin SHALL use only cross-platform compatible Node.js APIs and npm packages

### Requirement 10: VS Code Extension - Prompt Injection

**User Story:** As a developer, I want prompts received from the MX Creative Console to be automatically submitted to Kiro's chat, so that the AI starts processing immediately.

#### Acceptance Criteria

1. WHEN the Kiro_Extension receives a prompt via the Bridge, THE Kiro_Extension SHALL insert the prompt text into Kiro's active chat input
2. WHEN the prompt is inserted, THE Kiro_Extension SHALL automatically submit the prompt to Kiro for processing
3. IF Kiro's chat interface is not available, THEN THE Kiro_Extension SHALL queue the prompt and notify the user via VS Code notification
4. WHEN a queued prompt exists and Kiro's chat becomes available, THE Kiro_Extension SHALL submit the queued prompt within 1 second

### Requirement 11: Plugin Lifecycle Management

**User Story:** As a developer, I want the plugin to handle startup and shutdown cleanly, so that system resources are properly managed.

#### Acceptance Criteria

1. WHEN the Logi Plugin Service requests plugin shutdown, THE Plugin SHALL close the Bridge WebSocket server gracefully within 3 seconds
2. WHEN the Plugin shuts down, THE Plugin SHALL persist the current Tone_Level and any unsaved state to the Configuration_Store
3. WHEN the Plugin starts, THE Plugin SHALL check for the Kiro_Extension availability and set LCD_Icons to grey until connection is established
4. THE Plugin SHALL support hot reload during development via the `npm run watch` command without losing Configuration_Store state

### Requirement 12: Error Handling and Logging

**User Story:** As a developer, I want the plugin to handle errors gracefully and provide useful logs, so that I can diagnose issues quickly.

#### Acceptance Criteria

1. IF an unhandled exception occurs in the Plugin, THEN THE Plugin SHALL log the error with a stack trace and attempt to recover without crashing
2. THE Plugin SHALL write structured log entries (JSON format) with timestamp, severity level, and component name
3. WHEN the Bridge receives a malformed message, THE Plugin SHALL discard the message and log a warning with the raw message content
4. IF the Configuration_Store file becomes corrupted, THEN THE Plugin SHALL create a backup of the corrupted file and reset to defaults

