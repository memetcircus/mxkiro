namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Opens Kiro inline chat (Cmd+I) in the active editor.
    /// Allows direct AI editing at the cursor/selection position.
    /// </summary>
    public class InlineChatCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public InlineChatCommand()
            : base("Inline Chat", "Open inline chat at cursor", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/inline-chat");
            PluginLog.Info("✏️ Inline chat requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Inline\nChat";
    }
}
