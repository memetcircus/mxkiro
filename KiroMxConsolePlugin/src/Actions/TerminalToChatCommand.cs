namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Sends terminal output to Kiro chat (Cmd+Shift+R).
    /// Useful for quickly sharing build errors or command output with Kiro.
    /// </summary>
    public class TerminalToChatCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public TerminalToChatCommand()
            : base("Terminal to Chat", "Send terminal output to Kiro chat", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/terminal-to-chat");
            PluginLog.Info("⌨️ Terminal to chat requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Terminal\n→ Chat";
    }
}
