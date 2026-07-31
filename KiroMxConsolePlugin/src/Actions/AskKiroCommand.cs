namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Copies the currently selected text from any application and sends it to Kiro chat.
    /// Works like ChatGPT's "Ask ChatGPT" — select text anywhere, press button, Kiro answers.
    /// </summary>
    public class AskKiroCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public AskKiroCommand()
            : base("Ask Kiro", "Send selected text to Kiro chat", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/ask-kiro");
            PluginLog.Info("❓ Ask Kiro requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Ask\nKiro";
    }
}
