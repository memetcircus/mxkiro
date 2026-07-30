namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class DontCodeYetSnippet : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public DontCodeYetSnippet()
            : base("Don't Code Yet", "Append: discuss first, code later", "Kiro Snippets", tileIndex: 2) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/snippet?text=" + Uri.EscapeDataString("Don't write code yet. Let's discuss and debate first. We'll code after I approve the approach."));
            PluginLog.Info("📝 Snippet: Don't Code Yet");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Don't\nCode Yet";
    }
}
