namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class ExplainWhySnippet : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public ExplainWhySnippet()
            : base("Explain Why", "Append: explain your reasoning", "Kiro Snippets", tileIndex: 4) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/snippet?text=" + Uri.EscapeDataString("Explain your reasoning and tradeoffs before acting."));
            PluginLog.Info("📝 Snippet: Explain Why");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Explain\nWhy";
    }
}
