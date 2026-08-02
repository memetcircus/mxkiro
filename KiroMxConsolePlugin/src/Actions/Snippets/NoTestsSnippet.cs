namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class NoTestsSnippet : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public NoTestsSnippet()
            : base("No Tests", "Append: don't add tests", "Kiro Snippets", tileIndex: 7) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/snippet?text=" + Uri.EscapeDataString("Skip tests for now. Focus on implementation only."));
            PluginLog.Info("📝 Snippet: No Tests");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "No\nTests";
    }
}
