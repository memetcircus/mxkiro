namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class JustDoItSnippet : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public JustDoItSnippet()
            : base("Just Do It", "Append: don't ask, just implement", "Kiro Snippets", tileIndex: 2) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/snippet?text=" + Uri.EscapeDataString("Don't ask questions, just implement it."));
            PluginLog.Info("📝 Snippet: Just Do It");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Just\nDo It";
    }
}
