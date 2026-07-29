namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class ShowOptionsSnippet : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public ShowOptionsSnippet()
            : base("Show Options", "Append: give me alternatives", "Kiro Snippets", tileIndex: 3) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/snippet?text=" + Uri.EscapeDataString("Give me 2-3 options to choose from."));
            PluginLog.Info("📝 Snippet: Show Options");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Show\nOptions";
    }
}
