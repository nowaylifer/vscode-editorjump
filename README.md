## Features

Navigate in location history similar to `workbench.action.navigateForward` / `workbench.action.navigateBack` builtin commands, but skip current file locations and go straight to another file in history.

This extension contributes the following commands:

- `editorjump.navigateForward`: Navigate forward in jump history.
- `editorjump.navigateBack`: Navigate backward in jump history.
- `editorjump.clearJumplist`: Clear jump history.
- `editorjump.showJumplist`: Show the current jumplist in the output channel.

## Extension Settings

This extension contributes the following settings:

- `editorjump.jumplistLength`: The maximum number of files to remember in jump history (default is 20).
- `editorjump.removeOnClose`: If enabled, removes a file from the jumplist when it is closed (default is false).

## Release Notes

### 0.1.0

- Initial build
