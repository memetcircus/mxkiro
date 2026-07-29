namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class BeHonestSnippet : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public BeHonestSnippet()
            : base("Be Honest", "Append: be honest and critical", "Kiro Snippets", tileIndex: 1) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/snippet?text=" + Uri.EscapeDataString("Be honest, criticize. Suggest better alternatives."));
            PluginLog.Info("📝 Snippet: Be Honest");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Be\nHonest";
    }
}
