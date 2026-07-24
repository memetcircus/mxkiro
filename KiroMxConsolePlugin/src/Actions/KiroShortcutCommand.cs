namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Diagnostics;

    /// <summary>
    /// Sends keyboard shortcuts to Kiro IDE.
    /// Uses AppleScript on macOS to simulate key presses.
    /// </summary>
    public class KiroShortcutCommand : PluginDynamicCommand
    {
        public KiroShortcutCommand()
            : base("Kiro Shortcut", "Kiro IDE keyboard shortcuts", "Kiro IDE")
        {
            this.AddParameter("open-chat", "Open Chat", "IDE");
            this.AddParameter("inline-chat", "Inline Chat", "IDE");
            this.AddParameter("command-palette", "Commands", "IDE");
            this.AddParameter("go-to-file", "Go to File", "IDE");
            this.AddParameter("find-in-files", "Find", "IDE");
            this.AddParameter("debug", "Debug", "IDE");
            this.AddParameter("terminal", "Terminal", "IDE");
            this.AddParameter("autopilot", "Autopilot", "IDE");
        }

        protected override void RunCommand(String actionParameter)
        {
            var shortcut = actionParameter switch
            {
                "open-chat" => ("l", "command down, shift down"),
                "inline-chat" => ("i", "command down"),
                "command-palette" => ("p", "command down, shift down"),
                "go-to-file" => ("p", "command down"),
                "find-in-files" => ("f", "command down, shift down"),
                "debug" => ("96", ""), // F5 key code
                "terminal" => ("50", "control down"), // backtick key code
                "autopilot" => ("", ""), // TODO: specific shortcut
                _ => ("", "")
            };

            if (!String.IsNullOrEmpty(shortcut.Item1))
            {
                this.SendKeystroke(shortcut.Item1, shortcut.Item2);
            }

            PluginLog.Info($"Kiro shortcut: {actionParameter}");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize)
        {
            return actionParameter switch
            {
                "open-chat" => "💬\nOpen Chat",
                "inline-chat" => "✏️\nInline",
                "command-palette" => "🎯\nCommands",
                "go-to-file" => "📂\nGo to File",
                "find-in-files" => "🔍\nFind",
                "debug" => "🐞\nDebug",
                "terminal" => "⌨️\nTerminal",
                "autopilot" => "🤖\nAutopilot",
                _ => actionParameter
            };
        }

        private void SendKeystroke(String key, String modifiers)
        {
            try
            {
                String script;
                if (key.Length <= 2 && !Char.IsDigit(key[0]))
                {
                    // Regular character keystroke
                    script = String.IsNullOrEmpty(modifiers)
                        ? $"tell application \"System Events\" to keystroke \"{key}\""
                        : $"tell application \"System Events\" to keystroke \"{key}\" using {{{modifiers}}}";
                }
                else
                {
                    // Key code (for F keys, special keys)
                    script = String.IsNullOrEmpty(modifiers)
                        ? $"tell application \"System Events\" to key code {key}"
                        : $"tell application \"System Events\" to key code {key} using {{{modifiers}}}";
                }

                Process.Start(new ProcessStartInfo
                {
                    FileName = "osascript",
                    Arguments = $"-e '{script}'",
                    UseShellExecute = false,
                    CreateNoWindow = true
                });
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"Failed to send keystroke: {ex.Message}");
            }
        }
    }
}
