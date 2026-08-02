namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class KeepShortSnippet : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public KeepShortSnippet()
            : base("Keep Short", "Append: be concise", "Kiro Snippets", tileIndex: 6) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/snippet?text=" + Uri.EscapeDataString("Keep it focused. Only what is needed, nothing extra."));
            PluginLog.Info("📝 Snippet: Keep Short");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Keep\nShort";
    }
}
